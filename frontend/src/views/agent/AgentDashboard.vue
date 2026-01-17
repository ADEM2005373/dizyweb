<template>
  <div class="dashboard-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar glass">
      <div class="logo-area">
        <img src="../../assets/logo.jpg" alt="DIZY" class="sidebar-logo">
        <span class="admin-badge">ADMIN</span>
      </div>

      <nav class="side-nav">
        <router-link to="/agent/dashboard" class="nav-item active">
          <BoltIcon class="h-5 w-5" /> Dashboard
        </router-link>
        <router-link to="/agent/calendar" class="nav-item">
          <CalendarIcon class="h-5 w-5" /> Mon Agenda
        </router-link>
        <router-link to="/agent/requests" class="nav-item">
          <EnvelopeOpenIcon class="h-5 w-5" /> Demandes
        </router-link>
        <router-link to="/agent/clients" class="nav-item">
          <UsersIcon class="h-5 w-5" /> Mes Clients
        </router-link>
        <router-link to="/agent/profile" class="nav-item">
          <BriefcaseIcon class="h-5 w-5" /> Profil Pro
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
          <span class="agent-name">{{ user?.prenom }} {{ user?.nom }}</span>
          <div class="avatar agent">{{ user?.prenom?.charAt(0) }}</div>
        </div>
      </header>

      <!-- DASHBOARD OVERVIEW -->
      <div class="content-padding fade-in">
        
        <!-- KPI CARDS -->
        <!-- KPI CARDS -->
        <div class="grid-4 stats-grid">
          <div class="card glass stat-card">
            <div class="stat-value">{{ stats.clients }}</div>
            <div class="stat-label">Clients Actifs</div>
          </div>
          <div class="card glass stat-card">
            <div class="stat-value text-accent">{{ stats.pending }}</div>
            <div class="stat-label">Demandes en attente</div>
          </div>
          <div class="card glass stat-card">
            <div class="stat-value">{{ stats.meetings }}</div>
            <div class="stat-label">RDV Confirmés</div>
          </div>
          <div class="card glass stat-card">
            <div class="stat-value">98%</div>
            <div class="stat-label">Satisfaction</div>
          </div>
        </div>

        <div class="layout-split">
          <!-- UPCOMING APPOINTMENTS -->
          <div class="card glass section-card">
            <div class="card-header">
              <h3>Agenda du jour</h3>
              <button class="btn-icon"><CalendarDaysIcon class="h-5 w-5" /></button>
            </div>
            
            <div class="agenda-list">
              <div v-if="todayAgenda.length === 0" class="empty-state">Rien de prévu aujourd'hui.</div>
              <div v-for="rdv in todayAgenda" :key="rdv._id" class="agenda-item">
                <div class="time-slot">{{ formatDate(rdv.dateProposee) }}</div>
                <div class="agenda-details">
                  <h4>{{ rdv.type }} - {{ rdv.client?.entreprise || 'Client' }}</h4>
                  <p>Contact: {{ rdv.client?.nom }}</p>
                </div>
                <div class="action-btn"><CheckCircleIcon class="h-5 w-5 text-green" /></div>
              </div>
            </div>
          </div>

          <!-- PENDING REQUESTS -->
          <div class="card glass section-card">
            <div class="card-header">
              <h3>Demandes Récentes</h3>
            </div>
            <div class="request-list">
               <div v-if="recentRequests.length === 0" class="empty-state">Tout est à jour.</div>
               <div v-for="req in recentRequests" :key="req._id" class="request-item">
                 <div class="req-avatar">{{ req.client?.nom?.charAt(0) }}</div>
                 <div class="req-info">
                   <h4>{{ req.client?.entreprise }}</h4>
                   <p>{{ req.type }}</p>
                 </div>
                 <router-link to="/agent/requests" class="btn-xs btn-primary">Voir</router-link>
               </div>
            </div>
          </div>

          <!-- PENDING DOCUMENTS -->
          <div class="card glass section-card mt-20">
            <div class="card-header">
              <h3>Documents à Valider</h3>
              <router-link to="/agent/requests" class="btn-text">Gérer tout</router-link>
            </div>
            <div class="pending-docs-list">
               <div v-if="pendingDocs.length === 0" class="empty-state">Aucun document en attente.</div>
               <div v-for="doc in pendingDocs" :key="doc._id" class="doc-mini-item">
                  <div class="doc-icon-small">
                    <DocumentTextIcon v-if="doc.typeDocument === 'FACTURE'" class="h-5 w-5" />
                    <DocumentIcon v-else class="h-5 w-5" />
                  </div>
                  <div class="doc-mini-info">
                    <div class="doc-mini-title">{{ doc.clientId?.entreprise }}</div>
                    <div class="doc-mini-meta">{{ doc.typeDocument }} • {{ doc.montantTTC }} €</div>
                  </div>
                  <router-link to="/agent/requests" class="doc-btn-view"><Cog6ToothIcon class="h-4 w-4" /></router-link>
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
import axios from 'axios';
import { 
  BoltIcon, 
  CalendarIcon, 
  CalendarDaysIcon, 
  EnvelopeOpenIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  DocumentIcon, 
  Cog6ToothIcon 
} from '@heroicons/vue/24/outline';

const user = ref({});
const router = useRouter();
const stats = ref({
  clients: 0,
  pending: 0,
  meetings: 0
});
const todayAgenda = ref([]);
const recentRequests = ref([]);
const pendingDocs = ref([]);

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchDashboardData();
  } else {
    router.push('/login');
  }
});

const fetchDashboardData = async () => {
  try {
      // Get fresh user data to ensure nbrClient is up to date
      const token = localStorage.getItem('token');
      const userRes = await axios.get(`http://localhost:5000/api/users/${user.value._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      user.value = userRes.data;
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(user.value));
      
      // We use the rendezvous API as the source of truth for Agent activity
      // In a real app we might have dedicated endpoints or aggregations
      const res = await axios.get('http://localhost:5000/api/rendezvous');
      
      // Filter for this agent
      const myRDV = res.data.filter(r => r.agent?._id === user.value._id || r.agent === user.value._id);
      
      // Calculate Stats
      const pending = myRDV.filter(r => r.statut === 'en attente');
      const confirmed = myRDV.filter(r => r.statut === 'confirmé');
      
      stats.value = {
          clients: user.value.nbrClient || 0, // Use the nbrClient field from agent data
          pending: pending.length,
          meetings: confirmed.length
      };

      // Recent Requests (Latest 3 pending)
      recentRequests.value = pending.slice(0, 3);

      // Today's Agenda
      const today = new Date().toDateString();
      todayAgenda.value = confirmed.filter(r => new Date(r.dateProposee).toDateString() === today)
                                   .sort((a,b) => new Date(a.dateProposee) - new Date(b.dateProposee));

      // Fetch Pending Documents
      const docsRes = await axios.get(`http://localhost:5000/api/documentCommerciaux?agent=${user.value._id}`);
      pendingDocs.value = docsRes.data.filter(d => d.statut === 'EN_ATTENTE').slice(0, 3);

  } catch(err) {
      console.error("Dashboard fetch error", err);
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

const formatDate = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
.dot { color: var(--secondary); }

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;


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

/* STATS */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
}

.stat-value { font-size: 32px; font-weight: 700; margin-bottom: 5px; }
.stat-label { font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
.text-accent { color: var(--secondary); }

/* SPLIT LAYOUT */
.layout-split {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.section-card {
  padding: 25px;
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 15px;
}

.agenda-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: rgba(255,255,255,0.02);
  margin-bottom: 10px;
  border-left: 3px solid var(--secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.time-slot { font-weight: 700; font-family: var(--font-heading); font-size: 18px; width: 60px; }
.agenda-details h4 { margin: 0; font-size: 16px; }
.agenda-details p { margin: 0; font-size: 12px; color: var(--text-muted); }

.request-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.req-avatar {
  background: #333;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.req-info { flex: 1; }
.req-info h4 { margin: 0; font-size: 14px; }
.req-info p { margin: 0; font-size: 11px; color: var(--text-muted); }

.btn-xs { padding: 6px 12px; font-size: 12px; border-radius: 4px; text-decoration: none; color: white; display: inline-block; background: var(--primary); }

.empty-state {
    color: var(--text-muted);
    font-style: italic;
    padding: 20px;
    text-align: center;
}

.mt-20 { margin-top: 20px; }

/* PENDING DOCS WIDGET */
.pending-docs-list { display: flex; flex-direction: column; gap: 10px; }
.doc-mini-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
.doc-icon-small { font-size: 18px; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border-radius: 8px; }
.doc-mini-info { flex: 1; }
.doc-mini-title { font-size: 13px; font-weight: 700; color: white; margin-bottom: 2px; }
.doc-mini-meta { font-size: 11px; color: var(--text-muted); }
.doc-btn-view { text-decoration: none; font-size: 14px; padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.05); transition: 0.3s; color: white; }
.doc-btn-view:hover { background: var(--secondary); color: black; }
</style>
