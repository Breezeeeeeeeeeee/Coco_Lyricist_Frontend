// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/components/Home.vue'; // 主页面
import RenderPage from '@/components/RenderPage.vue'; // 渲染页面

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/render',
    name: 'RenderPage',
    component: RenderPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
