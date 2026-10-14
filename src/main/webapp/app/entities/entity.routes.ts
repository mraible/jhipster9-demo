import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'user-management',
    title: 'userManagement.home.title',
    loadChildren: () => import('./admin/user-management/user-management.routes'),
  },
  {
    path: 'authority',
    title: 'blogApp.adminAuthority.home.title',
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'blog',
    title: 'blogApp.blog.home.title',
    loadChildren: () => import('./blog/blog.routes'),
  },
  {
    path: 'post',
    title: 'blogApp.post.home.title',
    loadChildren: () => import('./post/post.routes'),
  },
  {
    path: 'tag',
    title: 'blogApp.tag.home.title',
    loadChildren: () => import('./tag/tag.routes'),
  },
  // jhipster-needle-add-entity-route - JHipster will add entity modules routes here
];

export default routes;
