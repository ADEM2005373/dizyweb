<template>
  <div class="agent-packs fade-in">
    <div class="header-action">
       <h2>Traitement Services Personnalisés</h2>
       <div class="tabs">
          <button :class="['tab', activeTab==='pending'?'active':'']" @click="activeTab='pending'">A traiter</button>
          <button :class="['tab', activeTab==='all'?'active':'']" @click="activeTab='all'">Historique</button>
       </div>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>
    <div v-else-if="filteredPacks.length === 0" class="empty-state card glass">
       Aucune demande de service en attente.
    </div>

    <div v-else class="packs-list">
       <div v-for="pack in filteredPacks" :key="pack._id" class="card glass pack-row">
          <div class="pack-info">
             <h4>{{ pack.clientRequest }}</h4>
             <p class="client">Client: {{ pack.clientId?.entreprise || pack.clientId?.nom }}</p>
             <span class="status-pill env">{{ pack.status }}</span>
          </div>
          <div class="pack-actions">
             <button v-if="pack.status === 'PENDING_AGENT'" @click="openProposalModal(pack)" class="btn btn-primary btn-sm">
                Faire Proposition
             </button>
             <span v-else class="text-muted text-xs">Traité</span>
          </div>
       </div>
    </div>

    <!-- PROPOSAL MODAL -->
    <div v-if="showModal" class="modal-overlay">
       <div class="modal-content glass">
          <h3>Proposition pour Pack</h3>
          <p class="mb-20"><strong>Demande :</strong> {{ currentPack.clientRequest }}</p>
          
          <form @submit.prevent="submitProposal">
             <div class="form-group">
                <label>Nom du Service (Public)</label>
                <input v-model="form.description" class="glass-input" placeholder="Ex: Développement sur mesure..." required />
             </div>
             <div class="form-group">
                <label>Prix (HT)</label>
                <input type="number" v-model="form.prixPropose" class="glass-input" required />
             </div>
             <div class="form-group">
                <label>Détails Techniques (pour Admin)</label>
                <textarea v-model="form.details" class="glass-input" rows="3"></textarea>
             </div>

             <div class="modal-actions">
                <button type="button" @click="showModal = false" class="btn btn-secondary">Annuler</button>
                <button type="submit" class="btn btn-success" :disabled="submitting">Valider</button>
             </div>
          </form>
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const packs = ref([]);
const loading = ref(true);
const activeTab = ref('pending');
const showModal = ref(false);
const submitting = ref(false);
const currentPack = ref(null);
const form = ref({ prixPropose: 0, description: '', details: '' });

onMounted(async () => {
    await fetchPacks();
});

const fetchPacks = async () => {
   try {
       const token = localStorage.getItem('token');
       // Get all packs (controller filters for agent -> sees all)
       // We might want to filter only Custom packs via query param if API supports it, or filter here.
       // Assuming getAllPacks returns everything for Agent.
       const res = await axios.get('http://localhost:5000/api/packs', {
           headers: { Authorization: `Bearer ${token}` }
       });
       console.log("AgentPacks received:", res.data);
       // Filter mainly for Custom packs that are private
       packs.value = res.data.filter(p => p.isCustom);
       console.log("AgentPacks filtered custom:", packs.value);
   } catch(e) { console.error(e); } 
   finally { loading.value = false; }
};

const filteredPacks = computed(() => {
   if(activeTab.value === 'pending') return packs.value.filter(p => p.status === 'PENDING_AGENT');
   return packs.value;
});

const openProposalModal = (p) => {
   currentPack.value = p;
   form.value = { prixPropose: 0, description: p.clientRequest, details: '' };
   showModal.value = true;
};

const submitProposal = async () => {
   submitting.value = true;
   try {
       const token = localStorage.getItem('token');
       await axios.put(`http://localhost:5000/api/packs/${currentPack.value._id}/proposal`, form.value, {
            headers: { Authorization: `Bearer ${token}` }
       });
       showModal.value = false;
       await fetchPacks(); // Refresh
   } catch(e) {
       alert("Erreur: " + e.message);
   } finally {
       submitting.value = false;
   }
};
</script>

<style scoped>
.agent-packs { padding: 20px; color: white; }
.header-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.tabs { display: flex; gap: 10px; }
.tab { background: transparent; border: none; color: #aaa; cursor: pointer; padding: 5px 10px; }
.tab.active { color: white; border-bottom: 2px solid var(--primary); }

.packs-list { display: flex; flex-direction: column; gap: 10px; }
.pack-row { padding: 15px; display: flex; justify-content: space-between; align-items: center; }
.pack-info h4 { margin: 0 0 5px 0; }
.client { font-size: 12px; color: #ccc; }
.status-pill { font-size: 10px; background: #333; padding: 2px 6px; border-radius: 4px; }

.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content: center; align-items:center; z-index:999; }
.modal-content { width: 500px; padding: 30px; background: #1e1e1e; border-radius: 12px; border: 1px solid #333; }
.glass-input { width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #444; color: white; border-radius: 6px; margin-top: 5px; }
.form-group { margin-bottom: 15px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
.btn-primary { background: var(--primary); color: white; }
.btn-secondary { background: #555; color: white; }
.btn-success { background: #00e676; color: black; }
.mb-20 { margin-bottom: 20px; }
</style>
