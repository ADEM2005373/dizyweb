<template>
  <div class="dashboard-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar glass">
      <div class="logo-area">
        <img src="../../assets/logo.jpg" alt="DIZY" class="sidebar-logo">
        <span class="admin-badge">ADMIN</span>
      </div>

      <nav class="side-nav">
        <li :class="{ active: current === 'stats' }" @click="current='stats'" class="nav-item">
          <ChartBarIcon class="h-5 w-5" /> Vue Globale
        </li>
        <li :class="{ active: current === 'clients' }" @click="current='clients'" class="nav-item">
          <UsersIcon class="h-5 w-5" /> Clients
        </li>
        <li :class="{ active: current === 'agents' }" @click="current='agents'" class="nav-item">
          <UserGroupIcon class="h-5 w-5" /> Agents
        </li>
        <li :class="{ active: current === 'templates' }" @click="current='templates'" class="nav-item">
          <DocumentTextIcon class="h-5 w-5" /> Templates Docs
        </li>
        <li :class="{ active: current === 'packs' }" @click="current='packs'" class="nav-item">
          <CubeIcon class="h-5 w-5" /> Offres & Packs
        </li>
        <li :class="{ active: current === 'profile' }" @click="current='profile'" class="nav-item">
          <Cog6ToothIcon class="h-5 w-5" /> Paramètres
        </li>
        <li :class="{ active: current === 'demandes' }" @click="current='demandes'" class="nav-item">
          <DocumentDuplicateIcon class="h-5 w-5" /> Demandes Docs
        </li>
      </nav>

      <div class="logout-area">
        <button @click="logout" class="btn btn-secondary full-width">
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <!-- TOP BAR -->
      <header class="top-bar glass">
        <div class="user-welcome">
          <h3>Administration Système</h3>
          <p class="subtitle">Vue d'ensemble de la plateforme DIZY.</p>
        </div>
        <div class="system-status">
          <span class="status-indicator online"></span> Système Opérationnel
        </div>
      </header>

      <!-- DYNAMIC CONTENT -->
      <div class="content-wrapper fade-in">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" />
        </transition>
      </div>
    </main>
  </div>
</template>

<script>
import { ChartBarIcon, UsersIcon, UserGroupIcon, DocumentTextIcon, CubeIcon, Cog6ToothIcon, DocumentDuplicateIcon } from '@heroicons/vue/24/outline';
import AdminStats from './AdminStats.vue'
import AdminUsers from './AdminUsers.vue'
import AdminAgents from './AdminAgents.vue'
import AdminPacks from './AdminPacks.vue'
import AdminProfile from './AdminProfile.vue'
import AdminDemandes from './AdminDemandes.vue'
import AdminTemplates from './AdminTemplates.vue'

export default {
  name: 'AdminDashboard',
  components: { AdminStats, AdminUsers, AdminAgents, AdminPacks, AdminProfile, AdminDemandes, AdminTemplates, ChartBarIcon, UsersIcon, UserGroupIcon, DocumentTextIcon, CubeIcon, Cog6ToothIcon, DocumentDuplicateIcon },
  data() {
    return {
      current: 'stats'
    }
  },
  computed: {
    currentComponent() {
      switch (this.current) {
        case 'clients': return 'AdminUsers'
        case 'agents': return 'AdminAgents'
        case 'packs': return 'AdminPacks'
        case 'profile': return 'AdminProfile'
        case 'demandes': return 'AdminDemandes'
        case 'templates': return 'AdminTemplates'
        default: return 'AdminStats'
      }
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-dark);
}

/* SIDEBAR */
.sidebar {
  width: 260px;
  height: 95vh;
  margin: 2.5vh;
  border-radius: var(--radius-md);
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 100;
  overflow-y: auto;
}

.logo-area {
  margin-bottom: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar-logo {
  width: 100%;
  max-width: 150px;
  border-radius: 12px;
  margin-bottom: 10px;
}
.dot { color: #ffeb3b; } /* Admin yellow accent */
.admin-badge {
  background: #ffeb3b;
  color: black;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.side-nav {
  display:flex;
  flex-direction: column;
  gap: px;
  flex: 1;
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
  width: 150px;

}

.nav-item.active {
  background: var(--bg-glass);
  color: var(--text-main);
  border: 1px solid #ffeb3b;
  width: 160px;
}

.icon { font-size: 9px; }

/* MAIN CONTENT */
.main-content {
  flex: 1;
  margin-left: 300px;
  padding: 2.5vh 30px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-radius: var(--radius-md);
  margin-bottom: 30px;
}

.user-welcome h3 { margin: 0; font-size: 20px; }
.subtitle { color: var(--text-muted); font-size: 14px; }

.system-status {
  font-size: 13px;
  color: #00e676;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 230, 118, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: #00e676;
  border-radius: 50%;
  box-shadow: 0 0 10px #00e676;
}


/* TRANSITIONS */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
