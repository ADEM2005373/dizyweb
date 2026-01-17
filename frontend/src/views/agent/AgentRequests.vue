<template>
  <div class="agent-requests-container">
    <div class="header-split">
      <div>
        <h2>Gestion des demandes</h2>
        <p class="subtitle">Validez ou reprogrammez les rendez-vous clients.</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs glass">
      <button :class="['tab-btn', activeTab === 'pending' ? 'active' : '']" @click="activeTab = 'pending'">
        En attente <span class="badge-count" v-if="pendingRequests.length">{{ pendingRequests.length }}</span>
      </button>
      <button :class="['tab-btn', activeTab === 'upcoming' ? 'active' : '']" @click="activeTab = 'upcoming'">
        Confirmés
      </button>
      <button :class="['tab-btn', activeTab === 'history' ? 'active' : '']" @click="activeTab = 'history'">
        Historique
      </button>
    </div>

    <!-- CONTENT -->
    <div class="tab-content">
      
      <!-- PENDING -->
      <div v-if="activeTab === 'pending'" class="fade-in">
         <div v-if="pendingRequests.length === 0" class="empty-state">
           <CheckCircleIcon class="h-10 w-10" />
           <p>Aucune demande en attente. Tout est à jour !</p>
         </div>
         <div class="grid-3">
             <div v-for="req in pendingRequests" :key="req._id" class="card glass request-card pending">
               <div class="req-header">
                 <h4>{{ req.client?.entreprise || 'Client Inconnu' }}</h4>
                 <div class="date-badge">{{ formatDate(req.dateProposee) }}</div>
               </div>
               <div class="req-body">
                 <p class="req-type">{{ req.type }}</p>
                 <p class="req-client"><UserIcon class="h-4 w-4 inline" /> {{ req.client?.prenom }} {{ req.client?.nom }}</p>
               </div>
               <div class="actions">
                 <button @click="updateStatus(req._id, 'confirmé')" class="btn btn-sm btn-success full">Accepter</button>
                 <button @click="updateStatus(req._id, 'annulé')" class="btn btn-sm btn-danger full">Refuser</button>
               </div>
             </div>
         </div>
      </div>

      <!-- UPCOMING -->
      <div v-if="activeTab === 'upcoming'" class="fade-in">
         <div v-if="upcomingRequests.length === 0" class="empty-state">
           <p>Aucun rendez-vous à venir.</p>
         </div>
         <div class="list-layout">
             <div v-for="req in upcomingRequests" :key="req._id" class="card glass list-item">
                 <div class="li-time">
                    <span class="li-date">{{ new Date(req.dateProposee).toLocaleDateString() }}</span>
                    <span class="li-hour">{{ new Date(req.dateProposee).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                 </div>
                 <div class="li-details">
                    <h4>{{ req.client?.entreprise }}</h4>
                    <p>{{ req.type }} - avec {{ req.client?.nom }}</p>
                 </div>
                 <div class="li-status">
                    <span class="status-pill confirmed">Confirmé</span>
                 </div>
                 <div class="li-actions">
                    <button @click="updateStatus(req._id, 'terminé')" class="btn-sm btn-neutral">Marquer Fini</button>
                 </div>
             </div>
         </div>
      </div>

      <!-- HISTORY -->
      <div v-if="activeTab === 'history'" class="fade-in">
          <div class="list-layout">
             <div v-for="req in historyRequests" :key="req._id" class="card glass list-item opacity-70">
                 <div class="li-time">
                    <span class="li-date">{{ new Date(req.dateProposee).toLocaleDateString() }}</span>
                 </div>
                 <div class="li-details">
                    <h4>{{ req.client?.entreprise }}</h4>
                    <p>{{ req.type }}</p>
                 </div>
                 <div class="li-status">
                    <span :class="['status-pill', req.statut]">{{ req.statut }}</span>
                 </div>
             </div>
          </div>
      </div>

    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { CheckCircleIcon, UserIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'AgentRequests',
  components: { CheckCircleIcon, UserIcon },
  data() {
    return {
      requests: [],
      user: null,
      activeTab: 'pending'
    }
  },
  computed: {
    pendingRequests() {
      return this.requests.filter(r => r.statut === 'en attente');
    },
    upcomingRequests() {
      // Confirmed only
      return this.requests.filter(r => r.statut === 'confirmé').sort((a,b) => new Date(a.dateProposee) - new Date(b.dateProposee));
    },
    historyRequests() {
      // Terminated or Cancelled
      return this.requests.filter(r => ['terminé', 'annulé'].includes(r.statut)).sort((a,b) => new Date(b.dateProposee) - new Date(a.dateProposee));
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.fetchRequests();
  },
  methods: {
    async fetchRequests() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/rendezvous', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter by this agent
        this.requests = res.data.filter(r => r.agent?._id === this.user._id || r.agent === this.user._id);
      } catch (err) {
        console.error(err);
      }
    },
    async updateStatus(id, newStatus) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/rendezvous/${id}`, 
          { statut: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.fetchRequests(); // refresh
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la mise à jour");
      }
    },
    formatDate(date) {
        return new Date(date).toLocaleString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    }
  }
}
</script>

<style scoped>
.tabs {
    display: flex;
    gap: 5px;
    padding: 5px;
    border-radius: var(--radius-sm);
    margin-bottom: 30px;
    width: fit-content;
}

.tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
    display: flex; align-items: center; gap: 8px;
}

.tab-btn.active {
    background: rgba(0,0,0,0.1);
    color: var(--text-main);
}

.badge-count {
    background: var(--primary);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
}

.grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

/* CARD STYLES */
.request-card { padding: 25px; display: flex; flex-direction: column; gap: 10px; border-top: 3px solid var(--secondary); transition: transform 0.2s; }
.request-card:hover { transform: translateY(-5px); }

.req-header { display: flex; justify-content: space-between; align-items: center; }
.req-header h4 { margin: 0; font-size: 16px; }
.date-badge { background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 12px; }

.req-body { margin-bottom: 10px; }
.req-type { color: var(--secondary); font-weight: 600; font-size: 14px; margin-bottom: 5px; }
.req-client { color: var(--text-muted); font-size: 13px; }
.h-10.w-10{
  width: 50px;
}
.actions { display: flex; gap: 10px; margin-top: auto; }
.full { flex: 1; }

.empty-state {
    text-align: center;
    padding: 50px;
    color: var(--text-muted);
}
.icon-lg { font-size: 40px; margin-bottom: 10px; display: block; }

/* LIST ITEM */
.list-layout { display: flex; flex-direction: column; gap: 10px; }
.list-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    gap: 20px;
}

.li-time { display: flex; flex-direction: column; text-align: center; min-width: 80px; padding-right: 20px; border-right: 1px solid rgba(255,255,255,0.05); }
.li-date { font-weight: 700; font-size: 14px; }
.li-hour { color: var(--text-muted); font-size: 12px; }

.li-details { flex: 1; }
.li-details h4 { margin: 0; font-size: 16px; margin-bottom: 4px; }
.li-details p { margin: 0; font-size: 13px; color: var(--text-muted); }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; font-weight: 700; }
.status-pill.confirmed { background: rgba(0, 230, 118, 0.1); color: #00e676; }
.status-pill.annulé { background: rgba(255, 76, 76, 0.1); color: #ff4c4c; }
.status-pill.terminé { background: rgba(255,255,255,0.05); color: var(--text-muted); }

.opacity-70 { opacity: 0.7; }
</style>
