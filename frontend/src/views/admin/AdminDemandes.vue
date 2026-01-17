<template>
  <div class="admin-demandes">
    <div class="header-split">
      <div>
        <h2>Validation des Documents</h2>
        <p class="subtitle">Vue d'ensemble de toutes les demandes de facturation et devis du système.</p>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs glass">
      <button :class="['tab-btn', activeTab === 'pending' ? 'active' : '']" @click="activeTab = 'pending'">
        En Attente
      </button>
      <button :class="['tab-btn', activeTab === 'all' ? 'active' : '']" @click="activeTab = 'all'">
        Historique Complet
      </button>
      <button :class="['tab-btn', activeTab === 'unpaid' ? 'active' : '']" @click="activeTab = 'unpaid'">
        <CurrencyEuroIcon class="h-4 w-4 inline mr-1" /> Impayés
      </button>
    </div>

    <div class="tab-content">
      <div v-if="loading" class="loading">Chargement des données...</div>
      
      <div v-else-if="filteredDocs.length === 0" class="empty-state card glass">
        <p>Aucun document à afficher.</p>
      </div>

      <div v-else class="docs-table-wrapper card glass">
        <table class="docs-table">
          <thead>
            <tr>
              <th>Réf</th>
              <th>Type</th>
              <th>Client</th>
              <th>Agent</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in filteredDocs" :key="doc._id">
              <td>
                <span class="ref-text" v-if="doc.reference">{{ doc.reference }}</span>
                <span v-else class="text-muted small">N/A</span>
              </td>
              <td>
                <span :class="['type-badge', doc.typeDocument.toLowerCase()]">{{ doc.typeDocument }}</span>
              </td>
              <td>
                <div class="name-info">
                  <span class="main">{{ doc.clientId?.entreprise }}</span>
                  <span class="sub">{{ doc.clientId?.nom }}</span>
                </div>
              </td>
              <td>
                <div class="name-info">
                  <span class="main">{{ doc.agentId?.nom }}</span>
                  <span class="sub">{{ doc.agentId?.specialite || 'Agent' }}</span>
                </div>
              </td>
              <td class="amount">{{ doc.montantTTC }} €</td>
              <td>{{ formatDate(doc.createdAt) }}</td>
              <td>
                <span :class="['status-pill', doc.statut.toLowerCase()]">{{ doc.statut }}</span>
              </td>
              <td>
                <span v-if="doc.statutPaiement && doc.statutPaiement !== 'SANS_OBJET'" :class="['payment-pill', doc.statutPaiement.toLowerCase()]">
                  {{ doc.statutPaiement === 'PAYE' ? 'Payé' : 'Non Payé' }}
                </span>
                <span v-else class="text-muted small">-</span>
              </td>
              <td>
                <div class="actions" v-if="doc.statut === 'EN_ATTENTE'">
                  <button @click="openApprovalModal(doc)" class="btn-icon check" title="Approuver"><CheckIcon class="h-4 w-4" /></button>
                  <button @click="updateStatus(doc._id, 'REFUSE')" class="btn-icon cross" title="Refuser"><XMarkIcon class="h-4 w-4" /></button>
                </div>
                <div class="actions" v-else-if="doc.statut === 'APPROUVE'">
                  <a v-if="doc.pdfPath" :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn-icon" title="Voir PDF"><FolderIcon class="h-4 w-4" /></a>
                  <button v-if="doc.typeDocument === 'FACTURE' && doc.statutPaiement === 'NON_PAYE'" 
                    @click="markAsPaid(doc._id)" class="btn-icon check" title="Marquer Payé"><CurrencyEuroIcon class="h-4 w-4" /></button>
                </div>
                <div v-else>-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- APPROVAL MODAL -->
    <div v-if="showApprovalModal" class="modal-overlay">
      <div class="modal-content glass">
        <h3>Approbation Administrative</h3>
        <p class="subtitle">En tant qu'admin, vous pouvez finaliser cette demande.</p>
        
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
import { CheckIcon, XMarkIcon, FolderIcon, CurrencyEuroIcon } from '@heroicons/vue/24/outline';

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
  await fetchAllDemandes();
  await fetchTemplates();
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
  calcHT();
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
  if (confirm("Confirmer le règlement de cette facture ?")) {
    await updateStatus(id, 'APPROUVE', { statutPaiement: 'PAYE', datePaiement: new Date() });
  }
};

const fetchAllDemandes = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/documentCommerciaux', {
      headers: { Authorization: `Bearer ${token}` }
    });
    docs.value = res.data;
  } catch (err) {
    console.error("Admin fetch error", err);
  } finally {
    loading.value = false;
  }
};

const filteredDocs = computed(() => {
  if (activeTab.value === 'pending') {
    return docs.value.filter(d => d.statut === 'EN_ATTENTE');
  }
  if (activeTab.value === 'unpaid') {
      return docs.value.filter(d => d.statutPaiement === 'NON_PAYE');
  }
  return docs.value;
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
    await fetchAllDemandes();
  } catch (err) {
    console.error("Update error", err);
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.header-split { margin-bottom: 30px; }
.tabs { display: flex; gap: 10px; padding: 5px; width: fit-content; margin-bottom: 25px; }
.tab-btn { background: transparent; border: none; color: var(--text-muted); padding: 8px 16px; border-radius: 4px; cursor: pointer; }
.tab-btn.active { background: rgba(0,0,0,0.1); color: var(--text-main); }

.docs-table-wrapper { padding: 0; overflow: hidden; }
.docs-table { width: 100%; border-collapse: collapse; text-align: left; }
.docs-table th, .docs-table td { padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.docs-table th { background: rgba(255,255,255,0.02); font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; }

.type-badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
.type-badge.facture { background: rgba(108, 93, 211, 0.2); color: #6c5dd3; }
.type-badge.devis { background: rgba(255, 159, 67, 0.2); color: #ff9f43; }

.name-info { display: flex; flex-direction: column; }
.name-info .main { font-weight: 600; font-size: 14px; }
.name-info .sub { font-size: 11px; color: var(--text-muted); }

.amount { font-weight: 700; color: var(--secondary); }

.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; font-weight: 700; }
.status-pill.refuse { background: rgba(255, 76, 76, 0.1); color: #ff4c4c; }

.ref-text { font-family: monospace; font-weight: 700; color: var(--secondary); font-size: 11px; }

.payment-pill { padding: 4px 10px; border-radius: 4px; font-size: 10px; text-transform: uppercase; font-weight: 800; }
.payment-pill.paye { background: rgba(0, 230, 118, 0.1); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.2); }
.payment-pill.non_paye { background: rgba(255, 193, 7, 0.1); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.2); }

.actions { display: flex; gap: 10px; }
.btn-icon { background: rgba(255,255,255,0.05); border: none; cursor: pointer; padding: 5px; border-radius: 4px; transition: 0.2s; }
.btn-icon:hover { background: rgba(255,255,255,0.1); }

.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.loading { text-align: center; padding: 20px; color: var(--secondary); }
</style>
