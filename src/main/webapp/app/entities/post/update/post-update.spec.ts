import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';
import { Subject, from, of } from 'rxjs';

import { IBlog } from 'app/entities/blog/blog.model';
import { BlogService } from 'app/entities/blog/service/blog.service';
import { TagService } from 'app/entities/tag/service/tag.service';
import { ITag } from 'app/entities/tag/tag.model';
import { IPost } from '../post.model';
import { PostService } from '../service/post.service';

import { PostFormService } from './post-form.service';
import { PostUpdate } from './post-update';

describe('Post Management Update Component', () => {
  let comp: PostUpdate;
  let fixture: ComponentFixture<PostUpdate>;
  let activatedRoute: ActivatedRoute;
  let postFormService: PostFormService;
  let postService: PostService;
  let blogService: BlogService;
  let tagService: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(PostUpdate);
    activatedRoute = TestBed.inject(ActivatedRoute);
    postFormService = TestBed.inject(PostFormService);
    postService = TestBed.inject(PostService);
    blogService = TestBed.inject(BlogService);
    tagService = TestBed.inject(TagService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Blog query and add missing value', () => {
      const post: IPost = { id: 2872 };
      const blog: IBlog = { id: 26836 };
      post.blog = blog;

      const blogCollection: IBlog[] = [{ id: 26836 }];
      vi.spyOn(blogService, 'query').mockReturnValue(of(new HttpResponse({ body: blogCollection })));
      const additionalBlogs = [blog];
      const expectedCollection: IBlog[] = [...additionalBlogs, ...blogCollection];
      vi.spyOn(blogService, 'addBlogToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ post });
      comp.ngOnInit();

      expect(blogService.query).toHaveBeenCalled();
      expect(blogService.addBlogToCollectionIfMissing).toHaveBeenCalledWith(
        blogCollection,
        ...additionalBlogs.map(i => expect.objectContaining(i) as typeof i),
      );
      expect(comp.blogsSharedCollection()).toEqual(expectedCollection);
    });

    it('should call Tag query and add missing value', () => {
      const post: IPost = { id: 2872 };
      const tags: ITag[] = [{ id: 19931 }];
      post.tags = tags;

      const tagCollection: ITag[] = [{ id: 19931 }];
      vi.spyOn(tagService, 'query').mockReturnValue(of(new HttpResponse({ body: tagCollection })));
      const additionalTags = [...tags];
      const expectedCollection: ITag[] = [...additionalTags, ...tagCollection];
      vi.spyOn(tagService, 'addTagToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ post });
      comp.ngOnInit();

      expect(tagService.query).toHaveBeenCalled();
      expect(tagService.addTagToCollectionIfMissing).toHaveBeenCalledWith(
        tagCollection,
        ...additionalTags.map(i => expect.objectContaining(i) as typeof i),
      );
      expect(comp.tagsSharedCollection()).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const post: IPost = { id: 2872 };
      const blog: IBlog = { id: 26836 };
      post.blog = blog;
      const tag: ITag = { id: 19931 };
      post.tags = [tag];

      activatedRoute.data = of({ post });
      comp.ngOnInit();

      expect(comp.blogsSharedCollection()).toContainEqual(blog);
      expect(comp.tagsSharedCollection()).toContainEqual(tag);
      expect(comp.post).toEqual(post);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<IPost>();
      const post = { id: 21634 };
      vi.spyOn(postFormService, 'getPost').mockReturnValue(post);
      vi.spyOn(postService, 'update').mockReturnValue(saveSubject);
      vi.spyOn(comp, 'previousState');
      activatedRoute.data = of({ post });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving()).toEqual(true);
      saveSubject.next(post);
      saveSubject.complete();

      // THEN
      expect(postFormService.getPost).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(postService.update).toHaveBeenCalledWith(expect.objectContaining(post));
      expect(comp.isSaving()).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<IPost>();
      const post = { id: 21634 };
      vi.spyOn(postFormService, 'getPost').mockReturnValue({ id: null });
      vi.spyOn(postService, 'create').mockReturnValue(saveSubject);
      vi.spyOn(comp, 'previousState');
      activatedRoute.data = of({ post: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving()).toEqual(true);
      saveSubject.next(post);
      saveSubject.complete();

      // THEN
      expect(postFormService.getPost).toHaveBeenCalled();
      expect(postService.create).toHaveBeenCalled();
      expect(comp.isSaving()).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<IPost>();
      const post = { id: 21634 };
      vi.spyOn(postService, 'update').mockReturnValue(saveSubject);
      vi.spyOn(comp, 'previousState');
      activatedRoute.data = of({ post });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving()).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(postService.update).toHaveBeenCalled();
      expect(comp.isSaving()).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareBlog', () => {
      it('should forward to blogService', () => {
        const entity = { id: 26836 };
        const entity2 = { id: 18619 };
        vi.spyOn(blogService, 'compareBlog');
        comp.compareBlog(entity, entity2);
        expect(blogService.compareBlog).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareTag', () => {
      it('should forward to tagService', () => {
        const entity = { id: 19931 };
        const entity2 = { id: 16779 };
        vi.spyOn(tagService, 'compareTag');
        comp.compareTag(entity, entity2);
        expect(tagService.compareTag).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
