import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { EMPTY, Observable, catchError, of } from 'rxjs';

import { IPost } from '../post.model';
import { PostService } from '../service/post.service';

const postResolve = (route: ActivatedRouteSnapshot): Observable<null | IPost> => {
  const { id } = route.params;
  if (id) {
    const router = inject(Router);
    const service = inject(PostService);
    return service.find(id).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          router.navigate(['404']);
        } else {
          router.navigate(['error']);
        }
        return EMPTY;
      }),
    );
  }

  return of(null);
};

export default postResolve;
