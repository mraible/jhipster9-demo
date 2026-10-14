import { HttpClient, HttpResponse, httpResource } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';

import dayjs from 'dayjs/esm';
import { Observable, map } from 'rxjs';

import { serverApiUrl } from 'app/config';
import { createRequestOption } from 'app/core/request';
import { IPost, NewPost } from '../post.model';

export type PartialUpdatePost = Partial<IPost> & Pick<IPost, 'id'>;

type RestOf<T extends IPost | NewPost> = Omit<T, 'date'> & {
  date?: string | null;
};

export type RestPost = RestOf<IPost>;

export type NewRestPost = RestOf<NewPost>;

export type PartialUpdateRestPost = RestOf<PartialUpdatePost>;

@Service()
export class PostsService {
  readonly postsParams = signal<Record<string, string | number | boolean | readonly (string | number | boolean)[]> | undefined>(undefined);
  readonly postsResource = httpResource<RestPost[]>(() => {
    const params = this.postsParams();
    if (!params) {
      return undefined;
    }
    return { url: this.resourceUrl, params };
  });
  /**
   * This signal holds the list of post that have been fetched. It is updated when the postsResource emits a new value.
   * In case of error while fetching the posts, the signal is set to an empty array.
   */
  readonly posts = computed(() =>
    (this.postsResource.hasValue() ? this.postsResource.value() : []).map(item => this.convertValueFromServer(item)),
  );
  protected readonly resourceUrl = `${serverApiUrl}api/posts`;

  protected convertValueFromServer(restPost: RestPost): IPost {
    return {
      ...restPost,
      date: restPost.date ? dayjs(restPost.date) : undefined,
    };
  }
}

@Service()
export class PostService extends PostsService {
  protected readonly http = inject(HttpClient);

  create(post: NewPost): Observable<IPost> {
    const copy = this.convertValueFromClient(post);
    return this.http.post<RestPost>(this.resourceUrl, copy).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(post: IPost): Observable<IPost> {
    const copy = this.convertValueFromClient(post);
    return this.http
      .put<RestPost>(`${this.resourceUrl}/${encodeURIComponent(this.getPostIdentifier(post))}`, copy)
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(post: PartialUpdatePost): Observable<IPost> {
    const copy = this.convertValueFromClient(post);
    return this.http
      .patch<RestPost>(`${this.resourceUrl}/${encodeURIComponent(this.getPostIdentifier(post))}`, copy)
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<IPost> {
    return this.http.get<RestPost>(`${this.resourceUrl}/${encodeURIComponent(id)}`).pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<HttpResponse<IPost[]>> {
    const options = createRequestOption(req);
    return this.http
      .get<RestPost[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => res.clone({ body: this.convertResponseArrayFromServer(res.body!) })));
  }

  delete(id: number): Observable<undefined> {
    return this.http.delete<undefined>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }

  getPostIdentifier(post: Pick<IPost, 'id'>): number {
    return post.id;
  }

  comparePost(o1: Pick<IPost, 'id'> | null, o2: Pick<IPost, 'id'> | null): boolean {
    return o1 && o2 ? this.getPostIdentifier(o1) === this.getPostIdentifier(o2) : o1 === o2;
  }

  addPostToCollectionIfMissing<Type extends Pick<IPost, 'id'>>(
    postCollection: Type[],
    ...postsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const posts: Type[] = postsToCheck.filter(postItem => postItem !== null && postItem !== undefined);
    if (posts.length > 0) {
      const postCollectionIdentifiers = postCollection.map(postItem => this.getPostIdentifier(postItem));
      const postsToAdd = posts.filter(postItem => {
        const postIdentifier = this.getPostIdentifier(postItem);
        if (postCollectionIdentifiers.includes(postIdentifier)) {
          return false;
        }
        postCollectionIdentifiers.push(postIdentifier);
        return true;
      });
      return [...postsToAdd, ...postCollection];
    }
    return postCollection;
  }

  protected convertValueFromClient<T extends IPost | NewPost | PartialUpdatePost>(post: T): RestOf<T> {
    return {
      ...post,
      date: post.date?.toJSON() ?? null,
    };
  }

  protected convertResponseFromServer(res: RestPost): IPost {
    return this.convertValueFromServer(res);
  }

  protected convertResponseArrayFromServer(res: RestPost[]): IPost[] {
    return res.map(item => this.convertValueFromServer(item));
  }
}
