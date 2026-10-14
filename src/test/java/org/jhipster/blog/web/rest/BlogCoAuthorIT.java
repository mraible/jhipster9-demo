package org.jhipster.blog.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import org.jhipster.blog.IntegrationTest;
import org.jhipster.blog.domain.Blog;
import org.jhipster.blog.domain.Post;
import org.jhipster.blog.repository.BlogRepository;
import org.jhipster.blog.repository.PostRepository;
import org.jhipster.blog.repository.UserRepository;
import org.jhipster.blog.security.FgaTuples;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

/**
 * Integration tests for sharing a blog with co-authors, which OpenFGA turns into a "writer" relationship.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser("user")
class BlogCoAuthorIT {

    private static final String BLOG_URL = "/api/blogs/{id}";
    private static final String CO_AUTHOR_URL = "/api/blogs/{id}/co-authors/{login}";

    @Autowired
    private ObjectMapper om;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FgaTuples fgaTuples;

    @Autowired
    private MockMvc restMockMvc;

    private Blog blog;

    @BeforeEach
    void initTest() {
        blog = blogRepository.saveAndFlush(
            new Blog().name("Shared blog").handle("shared").user(userRepository.findOneByLogin("user").orElseThrow())
        );
        fgaTuples.write("user:user", "owner", "blog:" + blog.getId());
    }

    @Test
    @Transactional
    void coAuthorCanWritePostsButNotManageTheBlog() throws Exception {
        restMockMvc.perform(get(BLOG_URL, blog.getId()).with(user("admin"))).andExpect(status().isForbidden());

        restMockMvc.perform(put(CO_AUTHOR_URL, blog.getId(), "admin")).andExpect(status().isNoContent());
        restMockMvc.perform(get(BLOG_URL + "/co-authors", blog.getId())).andExpect(jsonPath("$").value(contains("admin")));

        restMockMvc.perform(get(BLOG_URL, blog.getId()).with(user("admin"))).andExpect(status().isOk());
        restMockMvc.perform(get("/api/blogs").with(user("admin"))).andExpect(jsonPath("$.[*].id").value(hasItem(blog.getId().intValue())));

        Post post = new Post().title("Co-authored").content("Written by a co-author").date(Instant.now()).blog(blog);
        String created = restMockMvc
            .perform(post("/api/posts").with(user("admin")).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(post)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        Long postId = om.readValue(created, Post.class).getId();
        restMockMvc
            .perform(
                patch("/api/posts/{id}", postId)
                    .with(user("admin"))
                    .contentType("application/merge-patch+json")
                    .content("{\"id\":" + postId + ",\"title\":\"Edited by a co-author\"}")
            )
            .andExpect(status().isOk());
        restMockMvc
            .perform(get("/api/posts?sort=id,desc").with(user("user")))
            .andExpect(jsonPath("$.[*].id").value(hasItem(postId.intValue())));

        restMockMvc
            .perform(
                put(BLOG_URL, blog.getId()).with(user("admin")).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(blog))
            )
            .andExpect(status().isForbidden());
        restMockMvc.perform(delete(BLOG_URL, blog.getId()).with(user("admin"))).andExpect(status().isForbidden());
        restMockMvc.perform(put(CO_AUTHOR_URL, blog.getId(), "user").with(user("admin"))).andExpect(status().isForbidden());
    }

    @Test
    @Transactional
    void removingCoAuthorRevokesAccess() throws Exception {
        restMockMvc.perform(put(CO_AUTHOR_URL, blog.getId(), "admin")).andExpect(status().isNoContent());
        restMockMvc.perform(delete(CO_AUTHOR_URL, blog.getId(), "admin")).andExpect(status().isNoContent());

        restMockMvc.perform(get(BLOG_URL, blog.getId()).with(user("admin"))).andExpect(status().isForbidden());
        restMockMvc
            .perform(get("/api/blogs").with(user("admin")))
            .andExpect(jsonPath("$.[*].id").value(not(hasItem(blog.getId().intValue()))));
    }

    @Test
    @Transactional
    void usersWithoutBlogsGetEmptyLists() throws Exception {
        restMockMvc
            .perform(get("/api/blogs").with(user("nobody")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
        restMockMvc
            .perform(get("/api/posts").with(user("nobody")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @Transactional
    void deletingBlogRemovesAllItsTuples() throws Exception {
        restMockMvc.perform(put(CO_AUTHOR_URL, blog.getId(), "admin")).andExpect(status().isNoContent());

        restMockMvc.perform(delete(BLOG_URL, blog.getId())).andExpect(status().isNoContent());

        assertThat(fgaTuples.read("blog:" + blog.getId(), null)).isEmpty();
    }

    @Test
    @Transactional
    void movingPostReplacesItsParent() throws Exception {
        Blog other = blogRepository.saveAndFlush(new Blog().name("Other blog").handle("other").user(blog.getUser()));
        fgaTuples.write("user:user", "owner", "blog:" + other.getId());
        Post post = postRepository.saveAndFlush(new Post().title("Moving").content("Moving").date(Instant.now()).blog(blog));
        fgaTuples.write("blog:" + blog.getId(), "parent", "post:" + post.getId());
        Post moved = new Post().title("Moved").content("Moved").date(Instant.now()).blog(other);
        moved.setId(post.getId());

        restMockMvc
            .perform(put("/api/posts/{id}", post.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(moved)))
            .andExpect(status().isOk());

        assertThat(fgaTuples.read("post:" + post.getId(), "parent"))
            .singleElement()
            .satisfies(tuple -> assertThat(tuple.getUser()).isEqualTo("blog:" + other.getId()));
    }

    @Test
    @Transactional
    void cannotAddUnknownUserAsCoAuthor() throws Exception {
        restMockMvc.perform(put(CO_AUTHOR_URL, blog.getId(), "nobody")).andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void failedBlogDeleteKeepsOwnerTuple() throws Exception {
        Post post = postRepository.saveAndFlush(new Post().title("Keep me").content("Still here").date(Instant.now()).blog(blog));
        fgaTuples.write("blog:" + blog.getId(), "parent", "post:" + post.getId());

        restMockMvc.perform(delete(BLOG_URL, blog.getId())).andExpect(status().is5xxServerError());

        assertThat(fgaTuples.read("blog:" + blog.getId(), "owner")).anyMatch(tuple -> tuple.getUser().equals("user:user"));
    }

    @Test
    @Transactional
    void newBlogsBelongToTheCurrentUser() throws Exception {
        Long adminId = userRepository.findOneByLogin("admin").orElseThrow().getId();
        String body = "{\"name\":\"Mine\",\"handle\":\"mine\",\"user\":{\"id\":" + adminId + ",\"login\":\"user\"}}";

        String created = restMockMvc
            .perform(post("/api/blogs").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        Long id = om.readValue(created, Blog.class).getId();

        assertThat(blogRepository.findById(id).orElseThrow().getUser().getLogin()).isEqualTo("user");
        restMockMvc.perform(get(BLOG_URL, id).with(user("admin"))).andExpect(status().isForbidden());
    }

    @Test
    @Transactional
    void postsMustBelongToABlog() throws Exception {
        Post post = new Post().title("Orphan").content("No blog").date(Instant.now());
        restMockMvc
            .perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(post)))
            .andExpect(status().isBadRequest());
    }
}
