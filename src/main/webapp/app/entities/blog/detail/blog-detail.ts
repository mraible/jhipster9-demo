import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslatePipe } from '@ngx-translate/core';

import { AccountService } from 'app/core/auth/account.service';
import { Alert, AlertError } from 'app/shared/alert';
import { TranslateDirective } from 'app/shared/language';
import { IBlog } from '../blog.model';
import { BlogService } from '../service/blog.service';

@Component({
  selector: 'jhi-blog-detail',
  templateUrl: './blog-detail.html',
  imports: [FontAwesomeModule, FormsModule, Alert, AlertError, TranslateDirective, TranslatePipe, RouterLink],
})
export class BlogDetail {
  readonly blog = input<IBlog | null>(null);
  readonly coAuthors = signal<string[]>([]);
  readonly newCoAuthor = signal('');
  readonly isOwner = computed(() => this.blog()?.user?.login === this.accountService.account()?.login);

  private readonly blogService = inject(BlogService);
  private readonly accountService = inject(AccountService);

  constructor() {
    effect(() => {
      const id = this.blog()?.id;
      if (id) {
        this.loadCoAuthors(id);
      }
    });
  }

  addCoAuthor(id: number): void {
    const login = this.newCoAuthor().trim();
    if (login) {
      this.blogService.addCoAuthor(id, login).subscribe(() => {
        this.newCoAuthor.set('');
        this.loadCoAuthors(id);
      });
    }
  }

  removeCoAuthor(id: number, login: string): void {
    this.blogService.removeCoAuthor(id, login).subscribe(() => this.loadCoAuthors(id));
  }

  previousState(): void {
    globalThis.history.back();
  }

  private loadCoAuthors(id: number): void {
    this.blogService.getCoAuthors(id).subscribe(coAuthors => this.coAuthors.set(coAuthors));
  }
}
