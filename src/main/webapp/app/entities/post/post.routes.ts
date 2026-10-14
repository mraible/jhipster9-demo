import { Routes } from '@angular/router';

import { ASC } from 'app/config';
import { userRouteAccessService } from 'app/core/auth';

import PostResolve from './route/post-routing-resolve.service';

const postRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/post').then(m => m.Post),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/post-detail').then(m => m.PostDetail),
    resolve: {
      post: PostResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/post-update').then(m => m.PostUpdate),
    resolve: {
      post: PostResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/post-update').then(m => m.PostUpdate),
    resolve: {
      post: PostResolve,
    },
    canActivate: [userRouteAccessService],
  },
];

export default postRoute;
