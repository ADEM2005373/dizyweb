<template>
  <div class="client-requests-view fade-in">
    <div class="header-split">
      <div>
        <h2>Demandes de Documents</h2>
        <p class="subtitle">Demandez une facture ou un devis pour vos services.</p>
      </div>
      <button @click="showForm = true" class="btn btn-primary" v-if="!showForm">
        <PlusIcon class="h-5 w-5 mr-2" /> Nouvelle Demande
      </button>
    </div>

    <!-- REQUEST FORM -->
    <div v-if="showForm" class="card glass form-container fade-in">
      <h3>Détails de la demande</h3>
      <form @submit.prevent="submitRequest">
        <div class="form-row">
          <div class="form-group half">
            <label>Type de document</label>
            <select v-model="form.typeDocument" class="glass-input" required>
              <option value="FACTURE">Facture</option>
              <option value="DEVIS">Devis</option>
            </select>
          </div>
          <div class="form-group half">
            <label>Pack / Service</label>
            <select v-model="form.serviceId" class="glass-input" required>
              <option v-for="pack in availablePacks" :key="pack._id" :value="pack._id">
                {{ pack.titre }} ({{ pack.prix }} €)
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Commentaire / Détails</label>
          <textarea v-model="form.commentaire" class="glass-input" rows="3" placeholder="Description de votre besoin..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="showForm = false" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Envoi...' : 'Envoyer la demande' }}
          </button>
        </div>
      </form>
    </div>

    <!-- HISTORY -->
    <div class="requests-history mt-30">
      <h3>Historique de mes demandes</h3>
      <div v-if="loading" class="loading">Chargement...</div>
      <div v-else-if="requests.length === 0" class="empty-state card glass">
        Vous n'avez pas encore fait de demande.
      </div>
      <div v-else class="list-grid">
        <div v-for="req in requests" :key="req._id" class="card glass request-item">
          <div class="type-icon">
            <DocumentTextIcon v-if="req.typeDocument === 'FACTURE'" class="h-6 w-6" />
            <NewspaperIcon v-else class="h-6 w-6" />
          </div>
          <div class="req-info">
            <div class="main-info">
              <h4>
                <span v-if="req.reference" class="ref-badge">{{ req.reference }}</span>
                {{ req.typeDocument }} - {{ req.montantTTC }} €
              </h4>
              <span class="date">{{ formatDate(req.createdAt) }}</span>
            </div>
            <p v-if="req.commentaire" class="comment">"{{ req.commentaire }}"</p>
          </div>
          <div class="status">
            <span :class="['pill', req.statut.toLowerCase()]">{{ req.statut }}</span>
            <div v-if="req.statut === 'APPROUVE' && req.pdfPath" class="mt-5">
              <a :href="'http://localhost:5000' + req.pdfPath" target="_blank" class="btn-download">
                <ArrowDownTrayIcon class="h-4 w-4 inline mr-1" /> PDF
              </a>
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
  DocumentTextIcon, 
  NewspaperIcon, 
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/vue/24/outline';

const loading = ref(false);
const submitting = ref(false);
const showForm = ref(false);
const requests = ref([]);

const user = ref({});
const availablePacks = ref([]);

const form = ref({
  typeDocument: 'FACTURE',
  serviceId: '',
  commentaire: ''
});

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchPacks();
    await fetchRequests();
  }
});

const fetchPacks = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/packs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    availablePacks.value = res.data.filter(p => p.actif);
  } catch (err) {
    console.error("Fetch packs error", err);
  }
};

const fetchRequests = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const userId = user.value.id || user.value._id;
    const res = await axios.get(`http://localhost:5000/api/documentCommerciaux?client=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    requests.value = res.data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error("Fetch requests error", err);
  } finally {
    loading.value = false;
  }
};

const submitRequest = async () => {
  submitting.value = true;
  try {
    const token = localStorage.getItem('token');
    const userId = user.value.id || user.value._id;
    
    // Find selected pack for amount
    const selectedPack = availablePacks.value.find(p => p._id === form.value.serviceId);
    if (!selectedPack) throw new Error("Pack non sélectionné");

    let agentId = user.value.agentPrincipal;
    if (agentId && typeof agentId === 'object') {
      agentId = agentId._id || agentId.id;
    }

    await axios.post('http://localhost:5000/api/documentCommerciaux', {
      clientId: userId,
      agentId: agentId,
      serviceId: form.value.serviceId,
      montantTTC: selectedPack.prix,
      montantHT: selectedPack.prixHT,
      tva: selectedPack.tva,
      typeDocument: form.value.typeDocument,
      commentaire: form.value.commentaire,
      statut: 'EN_ATTENTE'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Demande envoyée !");
    showForm.value = false;
    form.value = { typeDocument: 'FACTURE', serviceId: '', commentaire: '' };
    await fetchRequests();
  } catch (err) {
    console.error("Submit error", err);
    alert(err.message || "Erreur lors de l'envoi de la demande");
  } finally {
    submitting.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.header-split { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.form-container { padding: 30px; margin-bottom: 30px; border-left: 4px solid var(--primary); }
.mt-30 { margin-top: 30px; }

.form-row { display: flex; gap: 20px; margin-bottom: 20px; }
.half { flex: 1; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 13px; color: var(--text-muted); }

.glass-input {
  width: 100%; padding: 12px; background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main);
}

.list-grid { display: flex; flex-direction: column; gap: 15px; }
.request-item { display: flex; gap: 20px; padding: 20px; align-items: center; }
.type-icon { font-size: 24px; background: rgba(255,255,255,0.05); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }

.req-info { flex: 1; }
.main-info { display: flex; align-items: center; gap: 15px; }
.main-info h4 { margin: 0; font-size: 16px; }
.date { font-size: 12px; color: var(--text-muted); }
.comment { margin: 5px 0 0; font-size: 13px; font-style: italic; color: var(--text-muted); }

.pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; font-weight: 700; }
.pill.en_attente { background: rgba(255, 193, 7, 0.1); color: #ffc107; }
.pill.approuve { background: rgba(0, 230, 118, 0.1); color: #00e676; }
.pill.refuse { background: rgba(255, 76, 76, 0.1); color: #ff4c4c; }

.ref-badge {
    background: rgba(255,255,255,0.1);
    color: var(--secondary);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 5px;
    font-family: monospace;
}

.btn-download {
  display: inline-block;
  margin-top: 5px;
  padding: 4px 8px;
  background: var(--primary);
  color: black;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  transition: 0.3s;
}
.btn-download:hover { transform: scale(1.05); }
.mt-5 { margin-top: 5px; }

.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.loading { text-align: center; padding: 20px; }
</style>
