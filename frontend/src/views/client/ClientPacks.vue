<template>
  <div class="client-packs fade-in">
    <div class="header-split">
      <div>
        <h2>Nos Solutions Digitales</h2>
        <p class="subtitle">Des packs sur-mesure pour booster votre croissance.</p>
      </div>
      <button @click="showSuggestionModal = true" class="btn btn-secondary">
         <SparklesIcon class="h-5 w-5" /> Suggérer un Service
      </button>
    </div>

    <!-- TABS or SECTIONS -->
    <div v-if="customPacks.length > 0" class="mb-50">
       <h3 class="mb-20">Mes Services Personnalisés</h3>
       <div class="packs-grid">
          <div v-for="pack in customPacks" :key="pack._id" class="card glass pack-card custom-card">
              <div class="status-badge" :class="pack.status.toLowerCase()">{{ getStatusLabel(pack.status) }}</div>
              <div class="pack-content">
                  <div class="icon-box custom-icon"><SparklesIcon class="h-8 w-8" /></div>
                  <h3>{{ pack.titre }}</h3>
                  <div class="price-box" v-if="pack.prix > 0">
                    <span class="currency">€</span>
                    <span class="amount">{{ pack.prix }}</span>
                  </div>
                  <div class="price-box" v-else>
                     <span class="text-muted text-sm">Sur Devis</span>
                  </div>
                  <p class="description">{{ pack.description }}</p>
              </div>
              <button v-if="pack.status === 'APPROVED'" @click="requestPack(pack)" class="btn btn-primary full-width mt-auto">
                 Commander
              </button>
              <div v-else class="text-center text-muted text-xs mt-auto">
                 En attente de validation
              </div>
          </div>
       </div>
       <hr class="separator" />
    </div>

    <h3 class="mb-20">Catalogue Standard</h3>

    <div v-if="loading" class="loading">Exploration des meilleures offres...</div>

    <div v-else class="packs-grid">
      <div v-for="pack in packs" :key="pack._id" class="card glass pack-card">
        <div class="pack-badge" v-if="pack.recommande">Recommandé</div>
        <div class="pack-content">
          <div class="icon-box"><BriefcaseIcon class="h-8 w-8" /></div>
          <h3>{{ pack.titre }}</h3>
          <div class="price-box">
            <span class="currency">€</span>
            <span class="amount">{{ pack.prix }}</span>
            <span class="period">/projet</span>
          </div>
          <p class="description">{{ pack.description }}</p>
          
          <ul class="features">
            <li v-for="f in pack.avantages" :key="f"><CheckIcon class="h-4 w-4 inline mr-1 text-primary" /><br> {{ f }}</li>
            <li v-if="!pack.avantages?.length"><CheckIcon class="h-4 w-4 inline mr-1 text-primary" /> <br> Support Priority</li>
            <li v-if="!pack.avantages?.length"><CheckCircleIcon class="h-4 w-4 inline mr-1 text-primary" /><br> Expert Consultation</li>
          </ul>
        </div>
        
        <button @click="requestPack(pack)" class="btn btn-primary full-width mt-auto">
          Commander ce pack
        </button>
      </div>
    </div>

    <div v-if="showSuggestionModal" class="modal-overlay">
       <div class="modal-content glass">
          <h3>Suggérer un Service</h3>
          <p class="subtitle">Décrivez votre besoin, nous créerons un pack sur-mesure pour vous.</p>
          
          <form @submit.prevent="submitSuggestion">
             <div class="form-group">
                <label>Description du besoin</label>
                <textarea v-model="suggestionText" class="glass-input" rows="4" placeholder="Ex: Je souhaite une intégration API spécifique..." required></textarea>
             </div>
             
             <div class="modal-actions">
                <button type="button" @click="showSuggestionModal = false" class="btn btn-secondary">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                   {{ submitting ? 'Envoi...' : 'Envoyer la suggestion' }}
                </button>
             </div>
          </form>
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

import { CheckIcon, CheckCircleIcon, BriefcaseIcon, SparklesIcon } from '@heroicons/vue/24/outline';

const packs = ref([]);
const customPacks = ref([]);
const loading = ref(true);
const showSuggestionModal = ref(false);
const submitting = ref(false);
const suggestionText = ref('');

onMounted(async () => {
  await fetchPacks();
});

const fetchPacks = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/packs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Split Standard vs Custom (Private)
    packs.value = res.data.filter(p => !p.private && p.actif);
    // Custom packs are those marked private and owned by this client (filtered by backend if role=client, but safe to filter here too)
    customPacks.value = res.data.filter(p => p.private);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const requestPack = async (pack) => {
  if (confirm(`Commander le pack "${pack.titre}" ?`)) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      // Create a formal document request (DEVIS) for the pack
      await axios.post('http://localhost:5000/api/documentCommerciaux', {
        clientId: user.id || user._id,
        agentId: user.agentPrincipal,
        typeDocument: 'DEVIS',
        montantTTC: pack.prix,
        commentaire: `COMMANDE PACK: ${pack.titre}`,
        statut: 'EN_ATTENTE'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Votre commande a été envoyée ! Votre agent va l'étudier et vous reviendra avec un devis détaillé.");
    } catch (e) {
      console.error(e);
      alert("Erreur envoi demande.");
    }
  }
};

const submitSuggestion = async () => {
   submitting.value = true;
   try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/packs/custom', {
         clientRequest: suggestionText.value
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      showSuggestionModal.value = false;
      suggestionText.value = '';
      await fetchPacks();
      alert("Votre suggestion a été envoyée ! Elle apparaitra dans vos services personnalisés une fois traitée.");
   } catch(e) {
      console.error(e);
      alert("Erreur suggestion");
   } finally {
      submitting.value = false;
   }
};

const getStatusLabel = (s) => {
   const map = {
      'PENDING_AGENT': 'En attente Agent',
      'PENDING_ADMIN': 'En attente Validation',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Refusé'
   };
   return map[s] || s;
};
</script>

<style scoped>
.header-split { margin-bottom: 40px; }
.packs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }

.pack-card { 
  padding: 40px 30px; text-align: center; display: flex; flex-direction: column; transition: 0.3s;
  position: relative; overflow: hidden;
  border-radius: 20px;
  width: 300px;
}
.pack-card:hover { transform: translateY(-10px); border-color: var(--primary); }

.pack-badge {
  position: absolute; top: 15px; right: -30px; background: var(--secondary); color: black; font-size: 10px;
  font-weight: 800; padding: 5px 40px; transform: rotate(45deg); text-transform: uppercase;
}

.icon-box { 
  width: 70px; height: 70px; margin: 0 auto 20px; background: rgba(108, 93, 211, 0.1);
  color: var(--primary); font-size: 32px; font-weight: 800; border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
}

.price-box { margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 5px; }
.currency { font-size: 18px; color: var(--text-muted); align-self: flex-start; margin-top: 5px; }
.amount { font-size: 42px; font-weight: 800; }
.period { font-size: 14px; color: var(--text-muted); align-self: flex-end; margin-bottom: 10px; }

.description { font-size: 14px; color: var(--text-muted); margin-bottom: 25px; line-height: 1.6; }

.features { list-style: none; padding: 0; margin: 0 0 30px 0; text-align: left; }
.features li { font-size: 13px; margin-bottom: 10px; color: var(--text-muted); }

.mt-auto { margin-top: auto; }
.loading { text-align: center; padding: 40px; font-weight: 600; color: var(--secondary); }
.h-4.w-4.inline.mr-1.text-primary{
  width: 30px;
  align-items: center;
}

.custom-card { border: 1px dashed var(--primary); background: rgba(108, 93, 211, 0.05); }
.custom-icon { background: rgba(224, 86, 253, 0.1); color: #e056fd; }

.status-badge {
    position: absolute; top: 15px; right: 15px;
    font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px;
    text-transform: uppercase;
}
.status-badge.pending_agent { background: orange; color: black; }
.status-badge.pending_admin { background: #e056fd; color: white; }
.status-badge.approved { background: #00e676; color: black; }

.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content: center; align-items:center; z-index:999; }
.modal-content { width: 500px; max-width: 90%; padding: 30px; border-radius: 16px; background: #1e1e1e; color: white; border: 1px solid #333; }
.glass-input { width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 8px; margin-top: 5px; outline: none; }
.form-group { margin-bottom: 20px; text-align: left; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; display:flex; align-items:center; gap:8px; }
.btn-secondary { background: #576574; color: white; }
.btn-primary { background: #3c40c6; color: white; }

.mb-50 { margin-bottom: 50px; }
.mb-20 { margin-bottom: 20px; }
.separator { border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0; }
.text-xs { font-size: 11px; }
.text-sm { font-size: 12px; }
.text-center { text-align: center; }
</style>
