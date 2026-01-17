<template>
  <div class="agent-demandes">
    <div class="header-split">
      <div>
        <h2>Demandes de Documents</h2>
        <p class="subtitle">Approuvez ou refusez les demandes de devis et factures de vos clients.</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs glass">
      <button :class="['tab-btn', activeTab === 'pending' ? 'active' : '']" @click="activeTab = 'pending'">
        À Valider
      </button>
      <button :class="['tab-btn', activeTab === 'history' ? 'active' : '']" @click="activeTab = 'history'">
        Historique
      </button>
    </div>

    <div class="tab-content">
      <div v-if="loading" class="loading">Chargement...</div>
      
      <div v-else-if="filteredDocs.length === 0" class="empty-state card glass">
        <p>Aucune demande {{ activeTab === 'pending' ? 'en attente' : 'dans l\'historique' }}.</p>
      </div>

      <div v-else class="docs-list">
        <div v-for="doc in filteredDocs" :key="doc._id" class="card glass doc-item">
          <div class="doc-type-icon">
            <DocumentTextIcon v-if="doc.typeDocument === 'FACTURE'" class="h-6 w-6" />
            <DocumentIcon v-else class="h-6 w-6" />
          </div>
          <div class="doc-info">
            <div class="doc-main">
              <h4>
                <span v-if="doc.reference" class="ref-badge">{{ doc.reference }}</span>
                {{ doc.typeDocument }} 
                <span v-if="doc.commentaire?.includes('COMMANDE PACK')" class="pack-tag">Livrable</span>
                - {{ doc.clientId?.entreprise }}
              </h4>
              <span class="doc-date">Le {{ formatDate(doc.createdAt) }}</span>
            </div>
            <div class="doc-details">
              <span class="amount">{{ doc.montantTTC }} €</span>
              <span class="client-name"><UserIcon class="h-4 w-4 inline" /> {{ doc.clientId?.prenom }} {{ doc.clientId?.nom }}</span>
            </div>
            <p class="comment" v-if="doc.commentaire">"{{ doc.commentaire }}"</p>
          </div>
          
          <div class="doc-status" v-if="activeTab === 'history'">
            <span :class="['status-pill', doc.statut.toLowerCase()]">{{ doc.statut }}</span>
            <span v-if="doc.statutPaiement && doc.statutPaiement !== 'SANS_OBJET'" :class="['payment-pill', doc.statutPaiement.toLowerCase()]">
              {{ doc.statutPaiement === 'PAYE' ? 'Payé' : 'Non Payé' }}
            </span>
          </div>

          <div class="doc-actions" v-if="activeTab === 'pending'">
            <button @click="openApprovalModal(doc)" class="btn btn-sm btn-success"><CheckIcon class="h-4 w-4 inline mr-1" /> Approuver</button>
            <button @click="updateStatus(doc._id, 'REFUSE')" class="btn btn-sm btn-danger"><XMarkIcon class="h-4 w-4 inline mr-1" /> Refuser</button>
          </div>

          <div class="doc-actions" v-if="activeTab === 'history'">
            <a v-if="doc.pdfPath" :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn btn-sm btn-primary"><FolderIcon class="h-4 w-4 inline mr-1" /> Voir PDF</a>
            <button v-if="doc.typeDocument === 'FACTURE' && doc.statutPaiement === 'NON_PAYE'" 
              @click="markAsPaid(doc._id)" class="btn btn-sm btn-success"><CurrencyEuroIcon class="h-4 w-4 inline mr-1" /> Marquer Payé</button>
          </div>
        </div>
      </div>
    </div>

    <!-- APPROVAL MODAL -->
    <div v-if="showApprovalModal" class="modal-overlay">
      <div class="modal-content glass">
        <h3>Finaliser l'approbation</h3>
        <p class="subtitle">Confirmez les détails financiers et le template pour générer le PDF.</p>
        
        <form @submit.prevent="confirmApproval">
          <div class="form-row">
            <div class="form-group half">
              <label>Montant HT (€)</label>
              <input type="number" v-model="approvalForm.montantHT" step="0.01" @input="calcTTC" class="glass-input" required>
            </div>
            <div class="form-group half">
              <label>TVA (%)</label>
              <input type="number" v-model="approvalForm.tva" @input="calcTTC" class="glass-input" required>
            </div>
          </div>

          <div class="form-group">
            <label>Montant TTC (€)</label>
            <input type="number" v-model="approvalForm.montantTTC" step="0.01" @input="calcHT" class="glass-input" required>
          </div>

          <div class="form-group">
            <label>Modèle de Document (Template)</label>
            <select v-model="approvalForm.templateId" class="glass-input" required>
              <option v-for="tpl in templates" :key="tpl._id" :value="tpl._id">
                {{ tpl.nomTemplate }}
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showApprovalModal = false" class="btn btn-secondary">Annuler</button>
            <button type="submit" class="btn btn-success" :disabled="approving">
              {{ approving ? 'Génération...' : 'Approuver & Générer PDF' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  UserIcon, 
  CheckIcon, 
  XMarkIcon, 
  FolderIcon, 
  CurrencyEuroIcon 
} from '@heroicons/vue/24/outline';

const user = ref({});
const docs = ref([]);
const activeTab = ref('pending');
const loading = ref(true);
const templates = ref([]);
const showApprovalModal = ref(false);
const approving = ref(false);
const currentDoc = ref(null);
const approvalForm = ref({
  montantHT: 0,
  tva: 20,
  montantTTC: 0,
  templateId: null
});

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchDemandes();
    await fetchTemplates();
  }
});

const fetchTemplates = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/templateDocuments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    templates.value = res.data.filter(t => t.actif);
    if (templates.value.length > 0) {
      approvalForm.value.templateId = templates.value[0]._id;
    }
  } catch (err) {
    console.error(err);
  }
};

const openApprovalModal = (doc) => {
  currentDoc.value = doc;
  approvalForm.value.montantTTC = doc.montantTTC;
  calcHT(); // Auto fill HT based on default 20% TVA
  showApprovalModal.value = true;
};

const calcTTC = () => {
  approvalForm.value.montantTTC = (approvalForm.value.montantHT * (1 + approvalForm.value.tva / 100)).toFixed(2);
};

const calcHT = () => {
  approvalForm.value.montantHT = (approvalForm.value.montantTTC / (1 + approvalForm.value.tva / 100)).toFixed(2);
};

const confirmApproval = async () => {
  approving.value = true;
  try {
    await updateStatus(currentDoc.value._id, 'APPROUVE', approvalForm.value);
    showApprovalModal.value = false;
  } finally {
    approving.value = false;
  }
};

const markAsPaid = async (id) => {
  if (confirm("Confirmer le paiement de cette facture ?")) {
    await updateStatus(id, 'APPROUVE', { statutPaiement: 'PAYE', datePaiement: new Date() });
  }
};

const fetchDemandes = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    // Fetch documents where agentId matches
    const currentAgentId = user.value.id || user.value._id;
    const res = await axios.get(`http://localhost:5000/api/documentCommerciaux?agent=${currentAgentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Fetched docs for agent:", res.data);
    docs.value = res.data;
  } catch (err) {
    console.error("Fetch demandes error", err);
  } finally {
    loading.value = false;
  }
};

const filteredDocs = computed(() => {
  if (activeTab.value === 'pending') {
    return docs.value.filter(d => d.statut === 'EN_ATTENTE');
  } else {
    return docs.value.filter(d => d.statut !== 'EN_ATTENTE');
  }
});

const updateStatus = async (id, status, extraData = {}) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/documentCommerciaux/${id}`, { 
      statut: status,
      ...extraData
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await fetchDemandes();
  } catch (err) {
    console.error("Update status error", err);
    alert("Erreur lors de la mise à jour");
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};
</script>

<style scoped>
.header-split { margin-bottom: 30px; }
.tabs { display: flex; gap: 10px; padding: 5px; width: fit-content; margin-bottom: 25px; }
.tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.tab-btn.active { background: rgba(0,0,0,0.1); color: var(--text-main); }

.docs-list { display: flex; flex-direction: column; gap: 15px; }
.doc-item { display: flex; align-items: center; padding: 20px; gap: 20px; }

.doc-type-icon { font-size: 24px; background: rgba(255,255,255,0.05); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }

.doc-info { flex: 1; }
.doc-main { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
.doc-main h4 { margin: 0; font-size: 16px; }
.doc-date { font-size: 12px; color: var(--text-muted); }

.doc-details { display: flex; align-items: center; gap: 20px; margin-bottom: 10px; }
.amount { font-weight: 700; color: var(--secondary); font-size: 18px; }
.client-name { font-size: 13px; color: var(--text-muted); }

.comment { font-size: 12px; font-style: italic; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; margin: 0; }

.doc-actions { display: flex; gap: 10px; }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; font-weight: 700; }
.status-pill.approuve { background: rgba(0, 230, 118, 0.1); color: #00e676; }
.status-pill.refuse { background: rgba(255, 76, 76, 0.1); color: #ff4c4c; }

.pack-tag {
  margin-left: 10px;
  vertical-align: middle;
}

.ref-badge {
  background: rgba(255,255,255,0.1);
  color: var(--secondary);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  border: 1px solid rgba(108, 93, 211, 0.3);
}

.payment-pill {
  display: block;
  margin-top: 5px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 800;
  text-align: center;
}
.payment-pill.paye { background: rgba(0, 230, 118, 0.2); color: #00e676; }
.payment-pill.non_paye { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
.payment-pill.en_attente { background: rgba(3, 169, 244, 0.2); color: #03a9f4; }

.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.loading { text-align: center; padding: 20px; color: var(--secondary); }
</style>
