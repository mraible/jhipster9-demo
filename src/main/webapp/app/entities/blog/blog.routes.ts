import { Routes } from '@angular/router';

import { ASC } from 'app/config';
import { userRouteAccessService } from 'app/core/auth';

import BlogResolve from './route/blog-routing-resolve.service';

const blogRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/blog').then(m => m.Blog),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/blog-detail').then(m => m.BlogDetail),
    resolve: {
      blog: BlogResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/blog-update').then(m => m.BlogUpdate),
    resolve: {
      blog: BlogResolve,
    },
    canActivate: [userRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/blog-update').then(m => m.BlogUpdate),
    resolve: {
      blog: BlogResolve,
    },
    canActivate: [userRouteAccessService],
  },
];

export default blogRoute;
