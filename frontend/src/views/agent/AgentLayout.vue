<template>
  <div class="dashboard-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar glass">
      <div class="logo-area">
        <img src="../../assets/logo.jpg" alt="DIZY" class="sidebar-logo">
        <span class="agent-badge">AGENT</span>
      </div>

      <nav class="side-nav">
        <router-link to="/agent/dashboard" class="nav-item" active-class="active">
          <span class="icon">⚡</span> Dashboard
        </router-link>
        <router-link to="/agent/calendar" class="nav-item" active-class="active">
          <span class="icon">🗓️</span> Mon Agenda
        </router-link>
        <router-link to="/agent/requests" class="nav-item" active-class="active">
          <span class="icon">📩</span> RDV Clientes
        </router-link>
        <router-link to="/agent/demandes" class="nav-item" active-class="active">
          <span class="icon">📑</span> Mes Demandes
        </router-link>
        <router-link to="/agent/services" class="nav-item" active-class="active">
          <span class="icon">✨</span> Services
        </router-link>
        <router-link to="/agent/portfolio" class="nav-item" active-class="active">
          <span class="icon">💼</span> Portfolio
        </router-link>
        <router-link to="/agent/clients" class="nav-item" active-class="active">
          <span class="icon">👥</span> Mes Clients
        </router-link>
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
          <h3>Espace Agent <span class="badge">PRO</span></h3>
          <p class="subtitle">Gérez vos rendez-vous et vos dossiers clients.</p>
        </div>
        <div class="user-profile">
          <ThemeToggle />
          <span class="agent-name">{{ user?.prenom }} {{ user?.nom }}</span>
          <div class="avatar agent">{{ user?.prenom?.charAt(0) }}</div>
        </div>
      </header>

      <!-- DYNAMIC CONTENT -->
      <div class="content-padding fade-in">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ThemeToggle from '../../components/ThemeToggle.vue';

const user = ref({});
const router = useRouter();

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  } else {
    router.push('/login');
  }
});

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
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
}

.logo-area h2 { font-size: 24px; }
.dot { color: var(--secondary); }

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
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
  text-decoration: none;
}

.nav-item:hover, .nav-item.active {
  background: var(--bg-glass);
  color: white;
  border: 1px solid var(--secondary);
}

.icon { font-size: 18px; }

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

.user-welcome h3 { margin: 0; font-size: 20px; display: flex; align-items: center; gap: 10px; }
.badge { font-size: 10px; background: var(--secondary); padding: 2px 6px; border-radius: 4px; color: black; font-weight: 700; }
.subtitle { color: var(--text-muted); font-size: 14px; }

.user-profile {
  display: flex;
  align-items: center;
  gap: 15px;
}

.agent-name { font-weight: 600; }

.avatar.agent {
  background: linear-gradient(135deg, var(--secondary), #ff9f43);
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: black;
}

.sidebar-logo {
  width: 100%;
  max-width: 150px;
  border-radius: 12px;
  margin-bottom: 10px;
}
.agent-badge {
  background: var(--secondary);
  color: black;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

/* TRANSITIONS */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
