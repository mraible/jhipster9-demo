import { MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faEye, faPencilAlt, faPlus, faSort, faSortDown, faSortUp, faSync, faTimes } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap/modal';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';

import { TagService } from '../service/tag.service';
import { sampleWithRequiredData } from '../tag.test-samples';

import { Tag } from './tag';

vi.useFakeTimers();

describe('Tag Management Component', () => {
  let httpMock: HttpTestingController;
  let comp: Tag;
  let fixture: ComponentFixture<Tag>;
  let service: TagService;
  let routerNavigateSpy: MockInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({
              defaultSort: 'id,asc',
            }),
            queryParamMap: of(
              convertToParamMap({
                page: '1',
                size: '1',
                sort: 'id,desc',
              }),
            ),
            snapshot: {
              queryParams: {},
              queryParamMap: convertToParamMap({
                page: '1',
                size: '1',
                sort: 'id,desc',
              }),
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(Tag);
    comp = fixture.componentInstance;
    service = TestBed.inject(TagService);
    routerNavigateSpy = vi.spyOn(comp.router, 'navigate');

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faEye, faPencilAlt, faPlus, faSort, faSortDown, faSortUp, faSync, faTimes);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('should call load all on init', async () => {
    // WHEN
    TestBed.tick();
    const req = httpMock.expectOne({ method: 'GET' });
    req.flush([{ id: 19931 }], { headers: { link: '<http://localhost/api/foo?page=1&size=20>; rel="next"' } });
    await vi.runAllTimersAsync();

    // THEN
    expect(comp.isLoading()).toEqual(false);
    expect(comp.tags()[0]).toEqual(expect.objectContaining({ id: 19931 }));
  });

  describe('trackId', () => {
    it('should forward to tagService', () => {
      const entity = { id: 19931 };
      vi.spyOn(service, 'getTagIdentifier');
      const id = comp.trackId(entity);
      expect(service.getTagIdentifier).toHaveBeenCalledWith(entity);
      expect(id).toBe(entity.id);
    });
  });

  it('should calculate the sort attribute for a non-id attribute', () => {
    // WHEN
    comp.navigateToWithComponentValues({ predicate: 'non-existing-column', order: 'asc' });

    // THEN
    expect(routerNavigateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        queryParams: expect.objectContaining({
          sort: ['non-existing-column,asc'],
        }),
      }),
    );
  });

  it('should calculate the sort attribute for an id', () => {
    // WHEN
    TestBed.tick();
    httpMock.expectOne({ method: 'GET' });

    // THEN
    expect(service.tagsParams()).toMatchObject({ sort: ['id,desc'] });
  });

  it('should infinite scroll', async () => {
    // GIVEN
    TestBed.tick();
    let req = httpMock.expectOne({ method: 'GET' });
    req.flush([{ id: 19931 }], { headers: { link: '<http://localhost/api/foo?page=1&size=20>; rel="next"' } });
    await vi.runAllTimersAsync();
    expect(comp.tags()).toHaveLength(1);
    expect(comp.tags()[0]).toEqual(expect.objectContaining({ id: 19931 }));

    // WHEN
    comp.loadNextPage();
    TestBed.tick();
    expect(service.tagsParams()).toMatchObject({ page: '1' });
    req = httpMock.expectOne({ method: 'GET' });
    req.flush([{ id: 16779 }], {
      headers: { link: '<http://localhost/api/foo?page=0&size=20>; rel="prev",<http://localhost/api/foo?page=2&size=20>; rel="next"' },
    });
    await vi.runAllTimersAsync();
    expect(comp.tags()).toHaveLength(2);
    expect(comp.tags()[1]).toEqual(expect.objectContaining({ id: 16779 }));

    comp.loadNextPage();
    TestBed.tick();
    expect(service.tagsParams()).toMatchObject({ page: '2' });
    req = httpMock.expectOne({ method: 'GET' });
    req.flush([{ id: 16779 }], {
      headers: { link: '<http://localhost/api/foo?page=0&size=20>; rel="prev",<http://localhost/api/foo?page=2&size=20>; rel="next"' },
    });
    await vi.runAllTimersAsync();
    expect(comp.tags()).toHaveLength(2);
    expect(comp.tags()[1]).toEqual(expect.objectContaining({ id: 16779 }));
  });

  describe('delete', () => {
    let ngbModal: NgbModal;
    let deleteModalMock: any;

    beforeEach(() => {
      deleteModalMock = { componentInstance: {}, closed: new Subject() };
      // NgbModal is not a singleton using TestBed.inject.
      // ngbModal = TestBed.inject(NgbModal);
      ngbModal = (comp as unknown as { modalService: NgbModal }).modalService;
      vi.spyOn(ngbModal, 'open').mockReturnValue(deleteModalMock);
    });

    it('on confirm should call load', () => {
      // GIVEN
      vi.spyOn(comp, 'load');

      // WHEN
      comp.delete(sampleWithRequiredData);
      deleteModalMock.closed.next('deleted');

      // THEN
      expect(ngbModal.open).toHaveBeenCalled();
      expect(comp.load).toHaveBeenCalled();
    });

    it('on dismiss should call load', () => {
      // GIVEN
      vi.spyOn(comp, 'load');

      // WHEN
      comp.delete(sampleWithRequiredData);
      deleteModalMock.closed.next();

      // THEN
      expect(ngbModal.open).toHaveBeenCalled();
      expect(comp.load).not.toHaveBeenCalled();
    });
  });
});
