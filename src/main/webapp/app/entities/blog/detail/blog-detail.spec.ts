import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { BlogDetail } from './blog-detail';

describe('Blog Management Detail Component', () => {
  let comp: BlogDetail;
  let fixture: ComponentFixture<BlogDetail>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./blog-detail').then(m => m.BlogDetail),
              resolve: { blog: () => of({ id: 26836 }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faArrowLeft);
    library.addIcons(faPencilAlt);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDetail);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load blog on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', BlogDetail);

      // THEN
      expect(instance.blog()).toEqual(expect.objectContaining({ id: 26836 }));
    });
  });

  describe('Co-authors', () => {
    it('should load co-authors for the blog', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', BlogDetail);
      harness.detectChanges();

      TestBed.inject(HttpTestingController).expectOne('api/blogs/26836/co-authors').flush(['jane']);

      expect(instance.coAuthors()).toEqual(['jane']);
    });
  });

  describe('PreviousState', () => {
    it('should navigate to previous state', () => {
      vi.spyOn(globalThis.history, 'back');
      comp.previousState();
      expect(globalThis.history.back).toHaveBeenCalled();
    });
  });
});
