import { createRouter, createWebHistory } from 'vue-router'

// Pages publiques
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import LandingPage from '../views/LandingPage.vue'

// Dashboards & Features
import AdminDashboard from '../views/admin/AdminDashboard.vue'

import AgentLayout from '../views/agent/AgentLayout.vue'
// import AgentRequests from '../views/agent/AgentRequests.vue'
// import AgentPortfolio from '../views/agent/AgentPortfolio.vue'
// import AgentCalendar from '../views/agent/AgentCalendar.vue' 

import ClientDashboard from '../views/client/ClientDashboard.vue'
import ClientPacks from '../views/client/ClientPacks.vue'
import ClientCalendar from '../views/client/ClientCalendar.vue'
import ClientPortfolio from '../views/client/ClientPortfolio.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/login', component: Login },
  { path: '/register', component: Register },

  // ADMIN
  {
    path: '/dashboard/admin', /* Legacy path support or redirect? Keeping for now */
    alias: '/admin/dashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  },

  // AGENT
  {
    path: '/agent',
    component: AgentLayout,
    meta: { requiresAuth: true, role: 'agent' },
    children: [
      {
        path: '',
        redirect: '/agent/dashboard'
      },
      {
        path: 'dashboard',
        component: () => import('../views/agent/AgentHome.vue'),
        name: 'AgentDashboard'
      },
      {
        path: 'calendar',
        component: () => import('../views/agent/AgentCalendar.vue'),
        name: 'AgentCalendar'
      },
      {
        path: 'requests',
        component: () => import('../views/agent/AgentRequests.vue'),
        name: 'AgentRequests'
      },
      {
        path: 'demandes',
        component: () => import('../views/agent/AgentDemandes.vue'),
        name: 'AgentDemandes'
      },
      {
        path: 'portfolio',
        component: () => import('../views/agent/AgentPortfolio.vue'),
        name: 'AgentPortfolio'
      },
      {
        path: 'clients',
        component: () => import('../views/agent/AgentClients.vue'),
        name: 'AgentClients'
      },
      {
        path: 'profile',
        component: () => import('../views/agent/AgentHome.vue'), // Placeholder
        name: 'AgentProfile'
      }
    ]
  },

  // CLIENT
  {
    path: '/client',
    component: () => import('../views/client/ClientLayout.vue'),
    meta: { requiresAuth: true, role: 'client' },
    children: [
      {
        path: 'dashboard',
        component: () => import('../views/client/ClientHome.vue'),
        name: 'ClientDashboard'
      },
      {
        path: 'services',
        component: () => import('../views/client/ClientPacks.vue'),
        name: 'ClientServices'
      },
      {
        path: 'rendez-vous',
        component: () => import('../views/client/ClientCalendar.vue'),
        name: 'ClientAppointments'
      },
      {
        path: 'portfolio',
        component: () => import('../views/client/ClientPortfolio.vue'),
        name: 'ClientPortfolio'
      },
      /*
      {
        path: 'documents',
        component: () => import('../views/client/ClientDocuments.vue'),
        name: 'ClientDocuments'
      },
      */
      {
        path: 'reseaux-sociaux',
        component: () => import('../views/client/ClientSocials.vue'),
        name: 'ClientSocials'
      },
      {
        path: 'requests',
        component: () => import('../views/client/ClientRequests.vue'),
        name: 'ClientRequests'
      },
      {
        path: 'profile',
        component: () => import('../views/client/ClientProfile.vue'),
        name: 'ClientProfile'
      }
    ]
  },

  { path: '/:catchAll(.*)', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))

  if (to.meta.requiresAuth && !user) {
    return next('/login')
  }

  if (to.meta.role && user?.role !== to.meta.role) {
    // If Admin, let them access mostly everything or redirect specific? 
    // For now strictly enforce role
    if (user.role === 'admin') return next(); // Admin super user
    return next('/login')
  }

  next()
})

export default router
