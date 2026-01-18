<template>
  <div class="agent-home">
    <!-- DASHBOARD OVERVIEW -->
    <div class="fade-in">
      
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
            <button class="btn-icon" @click="$router.push('/agent/calendar')"><CalendarDaysIcon class="h-5 w-5" /></button>
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
               <router-link v-if="req.isPack" to="/agent/services" class="btn-xs btn-primary">Traiter</router-link>
               <router-link v-else to="/agent/requests" class="btn-xs btn-primary">Voir</router-link>
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
import { CalendarDaysIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';

const user = ref({});
const stats = ref({
  clients: 0,
  pending: 0,
  meetings: 0
});
const todayAgenda = ref([]);
const recentRequests = ref([]);

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchDashboardData();
  }
});

const fetchDashboardData = async () => {
  try {
      const currentAgentId = user.value.id || user.value._id;
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // 1. Fetch assigned clients count
      const clientsRes = await axios.get(`http://localhost:5000/api/users?role=client`, { headers });
      const myClients = clientsRes.data.filter(u => u.agentPrincipal === currentAgentId);
      
      // 2. Fetch rendezvous stats
      const rdvRes = await axios.get('http://localhost:5000/api/rendezvous', { headers });
      const myRDV = rdvRes.data.filter(r => 
        (r.agent?._id === currentAgentId) || 
        (r.agent === currentAgentId)
      );
      
      const pendingRDV = myRDV.filter(r => r.statut === 'en attente');
      const confirmed = myRDV.filter(r => r.statut === 'confirmé');

      // 3. Fetch Pending Packs (Custom)
      const packsRes = await axios.get('http://localhost:5000/api/packs?status=PENDING_AGENT', { headers });
      const pendingPacks = packsRes.data.filter(p => p.isCustom);

      stats.value = {
          clients: myClients.length, 
          pending: pendingRDV.length + pendingPacks.length,
          meetings: confirmed.length
      };

      // Merge Requests
      const formattedPacks = pendingPacks.map(p => ({
          _id: p._id,
          type: 'Proposition Service',
          client: p.clientId, // populated
          isPack: true
      }));

      // Combine RDV + Packs
      recentRequests.value = [...pendingRDV, ...formattedPacks].slice(0, 5);
      const today = new Date().toDateString();
      todayAgenda.value = confirmed.filter(r => new Date(r.dateProposee).toDateString() === today)
                                   .sort((a,b) => new Date(a.dateProposee) - new Date(b.dateProposee));

  } catch(err) {
      console.error("Dashboard fetch error", err);
  }
};

const formatDate = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
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
  background: rgba(0,0,0,0.02);
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
  border-bottom: 1px solid rgba(0,0,0,0.05);
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

.btn-icon { background: transparent; border: none; cursor: pointer; font-size: 18px; }
</style>
