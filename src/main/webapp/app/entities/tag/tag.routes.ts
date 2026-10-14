import { Routes } from '@angular/router';

import { ASC } from 'app/config';
import { userRouteAccessService } from 'app/core/auth';

import TagResolve from './route/tag-routing-resolve.service';

const tagRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/tag').then(m => m.Tag),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/tag-detail').then(m => m.TagDetail),
    resolve: {
      tag: TagResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/tag-update').then(m => m.TagUpdate),
    resolve: {
      tag: TagResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/tag-update').then(m => m.TagUpdate),
    resolve: {
      tag: TagResolve,
    },
    canActivate: [userRouteAccessService],
  },
];

export default tagRoute;
