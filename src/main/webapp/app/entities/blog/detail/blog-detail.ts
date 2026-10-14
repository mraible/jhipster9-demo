import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Alert, AlertError } from 'app/shared/alert';
import { TranslateDirective } from 'app/shared/language';
import { IBlog } from '../blog.model';

@Component({
  selector: 'jhi-blog-detail',
  templateUrl: './blog-detail.html',
  imports: [FontAwesomeModule, Alert, AlertError, TranslateDirective, RouterLink],
})
export class BlogDetail {
  readonly blog = input<IBlog | null>(null);

  previousState(): void {
    globalThis.history.back();
  }
}
