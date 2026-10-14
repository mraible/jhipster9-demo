import { HttpResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Observable, finalize, map } from 'rxjs';

import { UserService } from 'app/entities/user/service/user.service';
import { IUser } from 'app/entities/user/user.model';
import { AlertError } from 'app/shared/alert';
import { TranslateDirective } from 'app/shared/language';
import { IBlog } from '../blog.model';
import { BlogService } from '../service/blog.service';

import { BlogFormGroup, BlogFormService } from './blog-form.service';

@Component({
  selector: 'jhi-blog-update',
  templateUrl: './blog-update.html',
  imports: [TranslateDirective, FontAwesomeModule, AlertError, ReactiveFormsModule],
})
export class BlogUpdate implements OnInit {
  readonly isSaving = signal(false);
  blog: IBlog | null = null;

  usersSharedCollection = signal<IUser[]>([]);

  protected blogService = inject(BlogService);
  protected blogFormService = inject(BlogFormService);
  protected userService = inject(UserService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: BlogFormGroup = this.blogFormService.createBlogFormGroup();

  compareUser = (o1: IUser | null, o2: IUser | null): boolean => this.userService.compareUser(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ blog }) => {
      this.blog = blog;
      if (blog) {
        this.updateForm(blog);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    globalThis.history.back();
  }

  save(): void {
    this.isSaving.set(true);
    const blog = this.blogFormService.getBlog(this.editForm);
    if (blog.id === null) {
      this.subscribeToSaveResponse(this.blogService.create(blog));
    } else {
      this.subscribeToSaveResponse(this.blogService.update(blog));
    }
  }

  protected subscribeToSaveResponse(result: Observable<IBlog | null>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving.set(false);
  }

  protected updateForm(blog: IBlog): void {
    this.blog = blog;
    this.blogFormService.resetForm(this.editForm, blog);

    this.usersSharedCollection.update(users => this.userService.addUserToCollectionIfMissing<IUser>(users, blog.user));
  }

  protected loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users, this.blog?.user)))
      .subscribe((users: IUser[]) => this.usersSharedCollection.set(users));
  }
}
