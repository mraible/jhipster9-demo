import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { DataUtils } from 'app/core/util';
import { Alert, AlertError } from 'app/shared/alert';
import { FormatMediumDatetimePipe } from 'app/shared/date';
import { type BlobType } from 'app/shared/jhipster/data-utils';
import { TranslateDirective } from 'app/shared/language';
import { IPost } from '../post.model';

@Component({
  selector: 'jhi-post-detail',
  templateUrl: './post-detail.html',
  imports: [FontAwesomeModule, Alert, AlertError, TranslateDirective, RouterLink, FormatMediumDatetimePipe],
})
export class PostDetail {
  readonly post = input<IPost | null>(null);

  protected dataUtils = inject(DataUtils);

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined, blobType?: BlobType): void {
    this.dataUtils.openFile(base64String, contentType, blobType);
  }

  previousState(): void {
    globalThis.history.back();
  }
}
