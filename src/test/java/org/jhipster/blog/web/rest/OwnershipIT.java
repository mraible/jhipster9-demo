package org.jhipster.blog.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.jhipster.blog.IntegrationTest;
import org.jhipster.blog.domain.Blog;
import org.jhipster.blog.domain.Post;
import org.jhipster.blog.domain.User;
import org.jhipster.blog.repository.BlogRepository;
import org.jhipster.blog.repository.PostRepository;
import org.jhipster.blog.repository.UserRepository;
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
 * Makes sure users can't change blogs and posts they don't own by sending a different owner in the request body.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser("user")
@Transactional
class OwnershipIT {

    @Autowired
    private ObjectMapper om;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restMockMvc;

    private User user;

    private Blog adminBlog;

    private Post adminPost;

    @BeforeEach
    void initTest() {
        user = userRepository.findOneByLogin("user").orElseThrow();
        adminBlog = blogRepository.saveAndFlush(
            new Blog().name("Admin blog").handle("admin").user(userRepository.findOneByLogin("admin").orElseThrow())
        );
        adminPost = postRepository.saveAndFlush(
            new Post().title("Admin post").content("Admin content").date(Instant.now()).blog(adminBlog)
        );
    }

    @Test
    void cannotTakeOverSomeoneElsesBlog() throws Exception {
        Blog blog = new Blog().name("Taken").handle("taken").user(user);
        blog.setId(adminBlog.getId());

        restMockMvc
            .perform(put("/api/blogs/{id}", adminBlog.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(blog)))
            .andExpect(status().isForbidden());
        restMockMvc
            .perform(
                patch("/api/blogs/{id}", adminBlog.getId())
                    .contentType("application/merge-patch+json")
                    .content("{\"id\":" + adminBlog.getId() + ",\"name\":\"Renamed\"}")
            )
            .andExpect(status().isForbidden());

        em.flush();
        em.clear();
        Blog unchanged = blogRepository.findById(adminBlog.getId()).orElseThrow();
        assertThat(unchanged.getName()).isEqualTo("Admin blog");
        assertThat(unchanged.getUser().getLogin()).isEqualTo("admin");
    }

    @Test
    void cannotWriteInSomeoneElsesBlog() throws Exception {
        Blog spoofed = new Blog().name("Admin blog").handle("admin").user(user);
        spoofed.setId(adminBlog.getId());
        Post post = new Post().title("Spam").content("Spam").date(Instant.now()).blog(spoofed);

        restMockMvc
            .perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(post)))
            .andExpect(status().isForbidden());
        restMockMvc
            .perform(
                patch("/api/posts/{id}", adminPost.getId())
                    .contentType("application/merge-patch+json")
                    .content("{\"id\":" + adminPost.getId() + ",\"title\":\"Edited\"}")
            )
            .andExpect(status().isForbidden());

        em.flush();
        em.clear();
        assertThat(postRepository.findById(adminPost.getId()).orElseThrow().getTitle()).isEqualTo("Admin post");
    }

    @Test
    void cannotMovePostIntoSomeoneElsesBlog() throws Exception {
        Blog userBlog = blogRepository.saveAndFlush(new Blog().name("User blog").handle("user").user(user));
        Post userPost = postRepository.saveAndFlush(
            new Post().title("User post").content("User content").date(Instant.now()).blog(userBlog)
        );
        Post moved = new Post().title("Moved").content("Moved").date(Instant.now()).blog(adminBlog);
        moved.setId(userPost.getId());

        restMockMvc
            .perform(put("/api/posts/{id}", userPost.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(moved)))
            .andExpect(status().isForbidden());
    }

    @Test
    void cannotCreatePostWithoutBlog() throws Exception {
        Post post = new Post().title("Orphan").content("Orphan").date(Instant.now());

        restMockMvc
            .perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(post)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void newBlogsBelongToTheCurrentUser() throws Exception {
        Blog blog = new Blog().name("Gift").handle("gift").user(adminBlog.getUser());

        String response = restMockMvc
            .perform(post("/api/blogs").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(blog)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Long id = om.readValue(response, Blog.class).getId();
        em.flush();
        em.clear();
        assertThat(blogRepository.findById(id).orElseThrow().getUser().getLogin()).isEqualTo("user");
    }
}
