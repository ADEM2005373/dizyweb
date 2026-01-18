<template>
  <div class="client-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar glass">
      <div class="logo-area">
        <img src="../../assets/logo.jpg" alt="DIZY" class="sidebar-logo">
      </div>

      <nav class="side-nav">
        <router-link to="/client/dashboard" class="nav-item" active-class="active">
          <div class="nav-icon purple"><ChartBarIcon class="h-5 w-5" /></div>
          <span class="nav-label">Tableau de bord</span>
        </router-link>
        <router-link to="/client/services" class="nav-item" active-class="active">
          <div class="nav-icon blue"><RocketLaunchIcon class="h-5 w-5" /></div>
          <span class="nav-label">Mes Services</span>
        </router-link>
        <router-link to="/client/reseaux-sociaux" class="nav-item" active-class="active">
          <div class="nav-icon pink"><DevicePhoneMobileIcon class="h-5 w-5" /></div>
          <span class="nav-label">Réseaux Sociaux</span>
        </router-link>
        <router-link to="/client/rendez-vous" class="nav-item" active-class="active">
          <div class="nav-icon orange"><CalendarIcon class="h-5 w-5" /></div>
          <span class="nav-label">Mes RDV</span>
        </router-link>
        <router-link to="/client/portfolio" class="nav-item" active-class="active">
          <div class="nav-icon green"><FolderIcon class="h-5 w-5" /></div>
          <span class="nav-label">Portfolio</span>
        </router-link>
        <router-link to="/client/requests" class="nav-item" active-class="active">
          <div class="nav-icon yellow"><DocumentDuplicateIcon class="h-5 w-5" /></div>
          <span class="nav-label">Demandes Docs</span>
        </router-link>
        <router-link to="/client/profile" class="nav-item mt-auto" active-class="active">
          <div class="nav-icon pink"><Cog6ToothIcon class="h-5 w-5" /></div>
          <span class="nav-label">Paramètres</span>
        </router-link>
      </nav>

      <div class="logout-area">
        <button @click="logout" class="btn-logout">
          <span>Déconnexion</span>
          <ArrowRightOnRectangleIcon class="h-5 w-5" />
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <div class="main-wrapper">
      <header class="top-bar glass-light">
        <div class="header-left">
          <div class="breadcrumb">
            <span class="text-muted">Espace Client</span>
            <span class="separator">/</span>
            <span class="current-page">{{ currentPageName }}</span>
          </div>
        </div>
        
        <div class="user-actions">
          <ThemeToggle />
          <div class="action-btn notifications">
            <BellIcon class="h-6 w-6 text-muted" />
            <span class="pulse"></span>
          </div>
          <div class="profile-compact" @click="$router.push('/client/profile')">
            <div class="profile-text">
              <span class="user-name">{{ user.prenom }} {{ user.nom }}</span>
              <span class="user-role">Client Privilège</span>
            </div>
            <div class="user-avatar-premium">
              {{ user.prenom?.charAt(0) }}
            </div>
          </div>
        </div>
      </header>

      <main class="content-view">
        <router-view v-slot="{ Component }">
          <transition name="slide-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ThemeToggle from '../../components/ThemeToggle.vue';
import { 
  ChartBarIcon, 
  RocketLaunchIcon, 
  DevicePhoneMobileIcon, 
  CalendarIcon, 
  FolderIcon, 
  DocumentDuplicateIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();
const route = useRoute();
const user = ref({});

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  } else {
    router.push('/login');
  }
});

const currentPageName = computed(() => {
  const path = route.path;
  if(path.includes('dashboard')) return 'Tableau de bord';
  if(path.includes('services')) return 'Mes Services';
  if(path.includes('reseaux-sociaux')) return 'Réseaux Sociaux';
  if(path.includes('rendez-vous')) return 'Rendez-vous';
  if(path.includes('portfolio')) return 'Portfolio';
  if(path.includes('requests')) return 'Demandes Docs';
  if(path.includes('profile')) return 'Mon Profil';
  return 'Aperçu';
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>

<style scoped>
.client-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-dark);
  color: var(--text-main);
  font-family: var(--font-body);
}

/* SIDEBAR */
.sidebar {
  width: 280px;
  height: calc(100vh - 40px);
  margin: 20px;
  border-radius: var(--radius-lg);
  padding: 40px 15px;
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 100;
  overflow-y: auto;

}

.logo-area {
  margin-bottom: 40px;
  text-align: center;
}

.sidebar-logo {
  width: 100%;
  max-width: 160px;
  border-radius: 12px;
}

.side-nav { display: flex; flex-direction: column; gap: 10px; flex: 1; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 18px;
  border-radius: 16px;
  color: #888;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 15px;
}

.nav-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(0,0,0,0.05);
  transition: 0.3s;
}

.nav-item:hover { color: var(--text-main); background: rgba(0,0,0,0.05); }
.nav-item.active {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-main);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.nav-item.active .nav-icon { background: var(--primary); color: white; box-shadow: 0 0 15px var(--primary); }
.mt-auto { margin-top: auto; }

.btn-logout {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 76, 76, 0.05);
  border: 1px solid rgba(255, 76, 76, 0.1);
  color: #ff4c4c;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: 0.3s;
}
.btn-logout:hover { background: #ff4c4c; color: white; transform: translateY(-2px); }
.btn-logout{
  width:170px;
}
/* MAIN WRAPPER */
.main-wrapper {
  flex: 1;
  margin-left: 320px;
  padding: 20px 40px 40px 0;
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 80px;
  border-radius: 24px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
}

.breadcrumb { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; }
.separator { color: rgba(0,0,0,0.2); }
.current-page { color: var(--text-main); }

.user-actions { display: flex; align-items: center; gap: 20px; }

.action-btn {
  width: 45px; height: 45px;
  background: rgba(0,0,0,0.05);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: 0.3s;
}
.action-btn:hover { background: rgba(0,0,0,0.1); transform: scale(1.05); }

.pulse {
  position: absolute; top: 12px; right: 12px;
  width: 8px; height: 8px;
  background: #ff4c4c; border-radius: 50%;
  border: 2px solid #000;
}

.profile-compact {
  display: flex; align-items: center; gap: 15px;
  padding: 8px 15px;
  background: rgba(0,0,0,0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: 0.3s;
}
.profile-compact:hover { background: rgba(0,0,0,0.1); }

.profile-text { display: flex; flex-direction: column; text-align: right; }
.user-name { font-size: 14px; font-weight: 700; color: var(--text-main); }
.user-role { font-size: 11px; color: var(--secondary); font-weight: 600; opacity: 0.8; }

.user-avatar-premium {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; color: black;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.content-view { flex: 1; padding: 0 5px; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.35s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(20px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
