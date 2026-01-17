<template>
  <div class="client-home fade-in">
    <div class="header-main">
      <div class="welcome-text">
        <h2>Content de vous revoir, {{ user.prenom }} ! 👋</h2>
        <p class="subtitle">Voici un aperçu de l'état de vos projets et prochains rendez-vous.</p>
      </div>
      <button @click="fetchDashboardData" class="btn-refresh" :class="{ rotating: loading }">
        <ArrowPathIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- STATS CARDS -->
    <div class="grid-4 stats-grid">
      <div class="card glass stat-card hover-lift">
        <div class="stat-icon purple"><RocketLaunchIcon class="h-7 w-7" /></div>
        <div class="stat-info">
          <h4>Services Actifs</h4>
          <p class="stat-value counter">{{ stats.services }}</p>
        </div>
      </div>
      <div class="card glass stat-card hover-lift">
        <div class="stat-icon blue"><CalendarIcon class="h-7 w-7" /></div>
        <div class="stat-info">
          <h4>Prochain RDV</h4>
          <p class="stat-date" v-if="nextRDV">{{ formatDateShort(nextRDV.dateProposee) }}</p>
          <p class="stat-date" v-else>Aucun</p>
        </div>
      </div>
      <div class="card glass stat-card hover-lift" @click="$router.push('/client/reseaux-sociaux')" style="cursor: pointer;">
        <div class="stat-icon pink"><DevicePhoneMobileIcon class="h-7 w-7" /></div>
        <div class="stat-info">
          <h4>Score Social</h4>
          <p class="stat-value counter">84%</p>
        </div>
      </div>
      <div class="card glass stat-card hover-lift">
        <div class="stat-icon orange"><FolderIcon class="h-7 w-7" /></div>
        <div class="stat-info">
          <h4>Livrables</h4>
          <p class="stat-value counter">{{ stats.livrables }}</p>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT GRID -->
    <div class="layout-split">
      <!-- PROJECT TRACKING -->
      <div class="card glass section-card">
        <div class="card-header">
          <h3>Suivi de Projet</h3>
          <span class="badge-count">{{ stats.services }} Actifs</span>
        </div>
        <div class="project-list">
          <div v-if="loading" class="loading-inline">Actualisation des projets...</div>
          <div v-else-if="projects.length === 0" class="empty-msg">
            <div class="empty-icon"><MoonIcon class="h-10 w-10" /></div>
            <p>Aucun service actif pour le moment.</p>
          </div>
          <div v-for="p in projects" :key="p._id" class="project-item">
            <div class="project-info">
              <h4>{{ p.packId?.titre || 'Service Digital' }}</h4>
              <p>Mise à jour {{ formatDateRelative(p.updatedAt) }}</p>
            </div>
            <div class="status-badge" :class="p.statut?.toLowerCase().replace(' ', '-')">
              {{ p.statut || 'En cours' }}
            </div>
          </div>
        </div>
      </div>

      <!-- UPCOMING MEETINGS -->
      <div class="card glass section-card">
         <div class="card-header">
          <h3>Rendez-Vous</h3>
          <button class="btn-text" @click="$router.push('/client/rendez-vous')">Voir tout</button>
        </div>
        <div class="appointment-list">
          <div v-if="loading" class="loading-inline">Recherche de créneaux...</div>
          <div v-else-if="appointments.length === 0" class="empty-msg">
            <div class="empty-icon"><CalendarIcon class="h-10 w-10" /></div>
            <p>Rien de prévu prochainement.</p>
          </div>
          <div v-for="rdv in appointments.slice(0, 3)" :key="rdv._id" class="appointment-item hover-slide">
            <div class="date-box">
              <span class="day">{{ new Date(rdv.dateProposee).getDate() }}</span>
              <span class="month">{{ getMonthName(rdv.dateProposee) }}</span>
            </div>
            <div class="apt-details">
              <h4>{{ rdv.type }}</h4>
              <p><MapPinIcon class="h-3 w-3 inline" /> Visioconférence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { 
  ArrowPathIcon, 
  RocketLaunchIcon, 
  CalendarIcon, 
  DevicePhoneMobileIcon, 
  FolderIcon, 
  MoonIcon, 
  MapPinIcon 
} from '@heroicons/vue/24/outline';

const user = ref({});
const stats = ref({
  services: 0,
  livrables: 0
});
const loading = ref(false);
const nextRDV = ref(null);
const projects = ref([]);
const appointments = ref([]);

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchDashboardData();
  }
});

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const userId = user.value.id || user.value._id;
    
    // 1. Fetch RDVs
    const rdvRes = await axios.get('http://localhost:5000/api/rendezvous', { headers });
    appointments.value = rdvRes.data.filter(r => r.client?._id === userId || r.client === userId)
                                   .sort((a,b) => new Date(a.dateProposee) - new Date(b.dateProposee));
    
    const now = new Date();
    nextRDV.value = appointments.value.find(a => new Date(a.dateProposee) >= now) || null;

    // 2. Fetch Projects (Portfolios as projects for now)
    const portRes = await axios.get(`http://localhost:5000/api/portfolios?client=${userId}`, { headers });
    projects.value = portRes.data;
    stats.value.services = projects.value.length;
    
    // 3. Fetch Portfolio items count
    if(portRes.data.length > 0) {
      const itemsRes = await axios.get(`http://localhost:5000/api/elementPortfolios?portfolio=${portRes.data[0]._id}`, { headers });
      stats.value.livrables = itemsRes.data.length;
    }

  } catch (err) {
    console.error("Client dashboard error", err);
  } finally {
    loading.value = false;
  }
};

const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatDateRelative = (date) => {
  if(!date) return 'récemment';
  const now = new Date();
  const diff = now - new Date(date);
  if (diff < 3600000) return 'à l\'instant';
  if (diff < 86400000) return 'aujourd\'hui';
  return new Date(date).toLocaleDateString();
};

const getMonthName = (date) => {
  return new Date(date).toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
};
</script>

<style scoped>
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 35px;
}

.welcome-text h2 { font-size: 26px; font-weight: 800; margin-bottom: 5px; }
.subtitle { color: var(--text-muted); font-size: 15px; }

.btn-refresh {
  background: rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.1);
  color: var(--text-main);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s;
}
.btn-refresh:hover { background: rgba(0,0,0,0.1); transform: rotate(30deg); }
.rotating { animation: spin 1s linear infinite; }

@keyframes spin { 100% { transform: rotate(360deg); } }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 35px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  transition: 0.3s;
}

.hover-lift:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  background: rgba(255,255,255,0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.stat-icon.purple { color: #bdb2ff; background: linear-gradient(135deg, rgba(189, 178, 255, 0.2), rgba(189, 178, 255, 0.05)); }
.stat-icon.blue { color: #a0c4ff; background: linear-gradient(135deg, rgba(160, 196, 255, 0.2), rgba(160, 196, 255, 0.05)); }
.stat-icon.pink { color: #ff85a2; background: linear-gradient(135deg, rgba(255, 133, 162, 0.2), rgba(255, 133, 162, 0.05)); }
.stat-icon.orange { color: #ffc6ff; background: linear-gradient(135deg, rgba(255, 198, 255, 0.2), rgba(255, 198, 255, 0.05)); }

.stat-info h4 { font-size: 13px; color: var(--text-muted); margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.stat-value { font-size: 32px; font-weight: 800; margin: 0; color: var(--text-main); }
.stat-date { font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0; }

.layout-split {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 30px;
}

.section-card { padding: 30px; min-height: 400px; display: flex; flex-direction: column; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.card-header h3 { font-size: 20px; margin: 0; font-weight: 700; }
.badge-count { font-size: 11px; font-weight: 700; background: var(--primary); color: black; padding: 4px 10px; border-radius: 20px; }

.btn-text { background: none; border: none; color: var(--secondary); cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; }
.btn-text:hover { color: var(--primary); }

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 16px;
  margin-bottom: 15px;
  transition: 0.3s;
}
.project-item:hover { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }

.project-info h4 { margin: 0 0 5px; font-size: 16px; }
.project-info p { margin: 0; font-size: 12px; color: var(--text-muted); }

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255,255,255,0.05);
}

.appointment-list { display: flex; flex-direction: column; gap: 5px; }

.appointment-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px;
  border-radius: 16px;
  transition: 0.3s;
  cursor: pointer;
}
.hover-slide:hover { background: rgba(255,255,255,0.03); transform: translateX(8px); }

.date-box {
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 14px;
  text-align: center;
  min-width: 70px;
  border: 1px solid rgba(255,255,255,0.1);
  transition: 0.3s;
}
.appointment-item:hover .date-box { background: var(--secondary); border-color: transparent; }
.appointment-item:hover .date-box .day,
.appointment-item:hover .date-box .month { color: black; }

.date-box .day { display: block; font-size: 24px; font-weight: 900; color: var(--secondary); line-height: 1; }
.date-box .month { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 4px; }

.apt-details h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; }
.apt-details p { margin: 0; font-size: 12px; color: var(--text-muted); }

.empty-msg { color: var(--text-muted); text-align: center; padding: 60px 0; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 40px; margin-bottom: 15px; opacity: 0.3; }

.loading-inline { font-size: 13px; color: var(--secondary); text-align: center; padding: 30px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
</style>
