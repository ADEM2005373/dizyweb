<template>
  <div class="dashboard-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar glass">
      <div class="logo-area">
        <img src="../../assets/logo.jpg" alt="DIZY" class="sidebar-logo">
      </div>

      <nav class="side-nav">
        <router-link to="/client/dashboard" class="nav-item active">
          <ChartBarIcon class="h-5 w-5" /> Tableau de bord
        </router-link>
        <router-link to="/client/services" class="nav-item">
          <RocketLaunchIcon class="h-5 w-5" /> Mes Services
        </router-link>
        <router-link to="/client/rendez-vous" class="nav-item">
          <CalendarIcon class="h-5 w-5" /> Rendez-Vous
        </router-link>
        <router-link to="/client/portfolio" class="nav-item">
          <FolderIcon class="h-5 w-5" /> Portfolio
        </router-link>
        <router-link to="/client/documents" class="nav-item">
          <DocumentDuplicateIcon class="h-5 w-5" /> Documents
        </router-link>
        <router-link to="/client/profile" class="nav-item">
          <Cog6ToothIcon class="h-5 w-5" /> Mon Profil
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
          <h3>Bonjour, <span class="text-primary">{{ user?.prenom }}</span></h3>
          <p class="subtitle">Voici ce qui se passe aujourd'hui.</p>
        </div>
        <div class="user-profile">
          <div class="avatar">{{ user?.prenom?.charAt(0) }}</div>
        </div>
      </header>

      <!-- DASHBOARD OVERVIEW -->
      <div class="content-padding fade-in">
        
        <!-- STATS CARDS -->
        <div class="grid-3 stats-grid">
          <div class="card glass stat-card">
            <div class="stat-icon purple"><RocketLaunchIcon class="h-7 w-7" /></div>
            <div class="stat-info">
              <h4>Services Actifs</h4>
              <p class="stat-value">2</p>
            </div>
          </div>
          <div class="card glass stat-card">
            <div class="stat-icon blue"><CalendarIcon class="h-7 w-7" /></div>
            <div class="stat-info">
              <h4>Prochain RDV</h4>
              <p class="stat-date">14 Jan, 10:00</p>
            </div>
          </div>
          <div class="card glass stat-card">
            <div class="stat-icon orange"><FolderIcon class="h-7 w-7" /></div>
            <div class="stat-info">
              <h4>Livrables</h4>
              <p class="stat-value">5</p>
            </div>
          </div>
        </div>

        <!-- RECENT ACTIVITY / NEXT STEPS -->
        <div class="layout-split">
          <div class="card glass section-card">
            <div class="card-header">
              <h3>Suivi de Projet</h3>
            </div>
            <div class="project-list">
              <div class="project-item">
                <div class="project-info">
                  <h4>Refonte Site Web</h4>
                  <p>En cours de développement</p>
                </div>
                <div class="status-badge in-progress">En cours</div>
              </div>
              <div class="project-item">
                <div class="project-info">
                  <h4>Campagne Social Media</h4>
                  <p>Planification terminée</p>
                </div>
                <div class="status-badge waiting">En attente</div>
              </div>
            </div>
          </div>

          <!-- RECENT DOCUMENTS -->
          <div class="card glass section-card">
            <div class="card-header">
              <h3>Derniers Documents</h3>
              <button class="btn-text" @click="$router.push('/client/documents')">Tout voir</button>
            </div>
            <div v-if="latestDocs.length === 0" class="empty-msg">Aucun document pour le moment.</div>
            <div class="recent-docs-list-mini">
               <div v-for="doc in latestDocs" :key="doc._id" class="doc-mini-item">
                  <div class="doc-icon-small">
                    <DocumentTextIcon v-if="doc.typeDocument === 'FACTURE'" class="h-5 w-5" />
                    <DocumentIcon v-else class="h-5 w-5" />
                  </div>
                  <div class="doc-mini-info">
                    <div class="doc-mini-title">{{ doc.reference || doc.typeDocument }}</div>
                    <div class="doc-mini-meta">{{ formatDate(doc.createdAt) }} • {{ doc.montantTTC }} €</div>
                  </div>
                  <div class="doc-mini-actions">
                     <a :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn-icon-mini" title="Télécharger"><ArrowDownTrayIcon class="h-4 w-4" /></a>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ChartBarIcon, 
  RocketLaunchIcon, 
  CalendarIcon, 
  FolderIcon, 
  DocumentDuplicateIcon, 
  Cog6ToothIcon, 
  DocumentTextIcon, 
  DocumentIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/vue/24/outline';

const user = ref({});
const latestDocs = ref([]);
const router = useRouter();

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchLatestDocs();
  } else {
    router.push('/login');
  }
});

const fetchLatestDocs = async () => {
  try {
    const userId = user.value.id || user.value._id;
    const axios = (await import('axios')).default;
    const res = await axios.get(`http://localhost:5000/api/documentCommerciaux?client=${userId}`);
    // Only approved and sorted by date
    latestDocs.value = res.data
      .filter(d => d.statut === 'APPROUVE')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  } catch (err) {
    console.error(err);
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

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
  
}

.logo-area {
  margin-bottom: 40px;
  text-align: center;
}

.sidebar-logo {
  width: 100%;
  max-width: 150px;
  border-radius: 12px;
  margin-bottom: 10px;
}

.dot { color: var(--primary); }

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
}

.nav-item:hover, .nav-item.active {
  background: var(--bg-glass);
  color: white;
  border: 1px solid var(--border);
}

.icon { font-size: 18px; }

/* MAIN CONTENT */
.main-content {
  flex: 1;
  margin-left: 300px; /* sidebar width + margin */
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

.avatar {
  width: 45px;
  height: 45px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255,255,255,0.05);
}

.stat-icon.purple { color: #bdb2ff; background: rgba(189, 178, 255, 0.1); }
.stat-icon.blue { color: #a0c4ff; background: rgba(160, 196, 255, 0.1); }
.stat-icon.orange { color: #ffc6ff; background: rgba(255, 198, 255, 0.1); }

.stat-info h4 { font-size: 14px; color: var(--text-muted); margin: 0; }
.stat-value { font-size: 24px; font-weight: 700; margin: 0; }
.stat-date { font-size: 18px; font-weight: 600; color: white; margin: 0; }

.layout-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.section-card {
  padding: 25px;
  min-height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 { font-size: 18px; margin: 0; }
.btn-text { background: none; border: none; color: var(--primary); cursor: pointer; }

/* LIST ITEMS */
.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255,255,255,0.02);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
}

.project-info h4 { margin: 0; font-size: 16px; }
.project-info p { margin: 0; font-size: 12px; color: var(--text-muted); }

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.status-badge.in-progress { background: rgba(45, 156, 219, 0.2); color: #2D9CDB; }
.status-badge.waiting { background: rgba(255, 193, 7, 0.2); color: #FFC107; }

.appointment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
}

.date-box {
  background: var(--bg-card);
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  min-width: 60px;
}

.date-box .day { display: block; font-size: 18px; font-weight: 700; }
.date-box .month { display: block; font-size: 10px; color: var(--text-muted); }

.apt-details h4 { margin: 0; font-size: 15px; }
.apt-details p { margin: 0; font-size: 12px; color: var(--text-muted); }

/* RECENT DOCS WIDGET */
.recent-docs-list-mini { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.doc-mini-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
.doc-icon-small { font-size: 18px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 8px; }
.doc-mini-info { flex: 1; }
.doc-mini-title { font-size: 13px; font-weight: 700; color: white; margin-bottom: 2px; }
.doc-mini-meta { font-size: 11px; color: var(--text-muted); }
.btn-icon-mini { text-decoration: none; font-size: 14px; padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.05); transition: 0.3s; }
.btn-icon-mini:hover { background: var(--primary); color: black; }
.empty-msg { text-align: center; color: var(--text-muted); padding: 20px; font-size: 14px; }
</style>
