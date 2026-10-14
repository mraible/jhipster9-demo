import { HttpClient, HttpResponse, httpResource } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';

import { Observable } from 'rxjs';

import { serverApiUrl } from 'app/config';
import { createRequestOption } from 'app/core/request';
import { IBlog, NewBlog } from '../blog.model';

export type PartialUpdateBlog = Partial<IBlog> & Pick<IBlog, 'id'>;

@Service()
export class BlogsService {
  readonly blogsParams = signal<Record<string, string | number | boolean | readonly (string | number | boolean)[]> | undefined>(undefined);
  readonly blogsResource = httpResource<IBlog[]>(() => {
    const params = this.blogsParams();
    if (!params) {
      return undefined;
    }
    return { url: this.resourceUrl, params };
  });
  /**
   * This signal holds the list of blog that have been fetched. It is updated when the blogsResource emits a new value.
   * In case of error while fetching the blogs, the signal is set to an empty array.
   */
  readonly blogs = computed(() => (this.blogsResource.hasValue() ? this.blogsResource.value() : []));
  protected readonly resourceUrl = `${serverApiUrl}api/blogs`;
}

@Service()
export class BlogService extends BlogsService {
  protected readonly http = inject(HttpClient);

  create(blog: NewBlog): Observable<IBlog> {
    return this.http.post<IBlog>(this.resourceUrl, blog);
  }

  update(blog: IBlog): Observable<IBlog> {
    return this.http.put<IBlog>(`${this.resourceUrl}/${encodeURIComponent(this.getBlogIdentifier(blog))}`, blog);
  }

  partialUpdate(blog: PartialUpdateBlog): Observable<IBlog> {
    return this.http.patch<IBlog>(`${this.resourceUrl}/${encodeURIComponent(this.getBlogIdentifier(blog))}`, blog);
  }

  find(id: number): Observable<IBlog> {
    return this.http.get<IBlog>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }

  query(req?: any): Observable<HttpResponse<IBlog[]>> {
    const options = createRequestOption(req);
    return this.http.get<IBlog[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<undefined> {
    return this.http.delete<undefined>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }

  getCoAuthors(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.resourceUrl}/${encodeURIComponent(id)}/co-authors`);
  }

  addCoAuthor(id: number, login: string): Observable<undefined> {
    return this.http.put<undefined>(`${this.resourceUrl}/${encodeURIComponent(id)}/co-authors/${encodeURIComponent(login)}`, null);
  }

  removeCoAuthor(id: number, login: string): Observable<undefined> {
    return this.http.delete<undefined>(`${this.resourceUrl}/${encodeURIComponent(id)}/co-authors/${encodeURIComponent(login)}`);
  }

  getBlogIdentifier(blog: Pick<IBlog, 'id'>): number {
    return blog.id;
  }

  compareBlog(o1: Pick<IBlog, 'id'> | null, o2: Pick<IBlog, 'id'> | null): boolean {
    return o1 && o2 ? this.getBlogIdentifier(o1) === this.getBlogIdentifier(o2) : o1 === o2;
  }

  addBlogToCollectionIfMissing<Type extends Pick<IBlog, 'id'>>(
    blogCollection: Type[],
    ...blogsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const blogs: Type[] = blogsToCheck.filter(blogItem => blogItem !== null && blogItem !== undefined);
    if (blogs.length > 0) {
      const blogCollectionIdentifiers = blogCollection.map(blogItem => this.getBlogIdentifier(blogItem));
      const blogsToAdd = blogs.filter(blogItem => {
        const blogIdentifier = this.getBlogIdentifier(blogItem);
        if (blogCollectionIdentifiers.includes(blogIdentifier)) {
          return false;
        }
        blogCollectionIdentifiers.push(blogIdentifier);
        return true;
      });
      return [...blogsToAdd, ...blogCollection];
    }
    return blogCollection;
  }
}
