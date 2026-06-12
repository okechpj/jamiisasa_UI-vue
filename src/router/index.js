import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'feed', component: () => import('@/views/feed/FeedView.vue') },
      {
        path: 'connections',
        name: 'connections',
        component: () => import('@/views/connections/ConnectionsView.vue'),
      },
      {
        path: 'connections/pending',
        name: 'pending-requests',
        component: () => import('@/views/connections/PendingRequestsView.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/profile/ProfileView.vue'),
      },
      {
        path: 'profile/:id',
        name: 'user-profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        props: true,
      },

      // --- Marketplace (customer discovery) ---
      {
        path: 'marketplace/providers',
        name: 'marketplace-providers',
        component: () => import('@/views/marketplace/MarketplaceView.vue'),
      },
      {
        path: 'marketplace/providers/:id',
        name: 'provider-details',
        component: () => import('@/views/marketplace/ProviderDetailsView.vue'),
        props: true,
      },
      {
        path: 'marketplace/booking/:providerId/:serviceId',
        name: 'booking',
        component: () => import('@/views/marketplace/BookingView.vue'),
        props: true,
      },
      {
        path: 'bookings',
        name: 'my-bookings',
        component: () => import('@/views/bookings/MyBookingsView.vue'),
      },

      // --- Chat & quote negotiation (per booking) ---
      {
        path: 'chat/:bookingId',
        name: 'chat',
        component: () => import('@/views/chat/ChatRoom.vue'),
        props: true,
      },

      // --- Payment checkout (per booking) ---
      {
        path: 'checkout/:bookingId',
        name: 'checkout',
        component: () => import('@/views/payment/CheckoutView.vue'),
        props: true,
      },

      // --- Provider dashboard (admin/provider only) ---
      {
        path: 'provider/profile',
        name: 'provider-profile',
        component: () => import('@/views/provider/ProfileView.vue'),
        meta: { roles: ['admin', 'provider'] },
      },
      {
        path: 'provider/services',
        name: 'provider-services',
        component: () => import('@/views/provider/ServicesView.vue'),
        meta: { roles: ['admin', 'provider'] },
      },
      {
        path: 'provider/availability',
        name: 'provider-availability',
        component: () => import('@/views/provider/AvailabilityView.vue'),
        meta: { roles: ['admin', 'provider'] },
      },
      {
        path: 'provider/bookings',
        name: 'provider-bookings',
        component: () => import('@/views/provider/BookingsView.vue'),
        meta: { roles: ['admin', 'provider'] },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', redirect: { name: 'login' } },
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'feed' }
  }

  // Role-gated routes (e.g. the provider dashboard) — send disallowed users home.
  if (Array.isArray(to.meta.roles) && !to.meta.roles.includes(auth.role)) {
    return { name: 'feed' }
  }

  return true
})

export default router
