<template>
  <div class="client-docs fade-in">
    <div class="header-split">
      <div>
        <h2>Centre de Documents</h2>
        <p class="subtitle">Consultez et téléchargez vos factures et devis validés.</p>
      </div>
      <button class="btn btn-secondary" @click="$router.push('/client/requests')">
        Faire une demande
      </button>
    </div>

    <!-- FILTERS (Placeholder) -->
    <div class="filters glass">
      <button class="filter-btn active">Tous</button>
      <button class="filter-btn">Factures</button>
      <button class="filter-btn">Devis</button>
    </div>

    <div v-if="loading" class="loading">Préparation de vos documents...</div>

    <div v-else class="docs-container">
      <div v-if="approvedDocs.length === 0" class="empty-state card glass">
        <p>Aucun document validé disponible pour le moment.</p>
        <router-link to="/client/requests" class="text-primary">
          Vérifier l'état de mes demandes <ArrowRightIcon class="h-4 w-4 inline" />
        </router-link>
      </div>

      <div v-else class="docs-grid">
        <div v-for="doc in approvedDocs" :key="doc._id" class="card glass doc-card">
          <div class="doc-icon">
            <DocumentTextIcon v-if="doc.typeDocument === 'FACTURE'" class="h-8 w-8" />
            <DocumentIcon v-else class="h-8 w-8" />
          </div>
          <div class="doc-body">
            <div class="doc-header">
              <h4>{{ doc.reference || doc.typeDocument }}</h4>
              <span :class="['payment-pill', doc.statutPaiement?.toLowerCase()]" v-if="doc.statutPaiement !== 'SANS_OBJET'">
                {{ doc.statutPaiement === 'PAYE' ? 'Payé' : 'Non Payé' }}
              </span>
              <span v-else class="status-pill active">Validé</span>
            </div>
            <div class="doc-meta">
              <span class="date"><CalendarIcon class="h-4 w-4 inline mr-1" /> {{ formatDate(doc.createdAt) }}</span>
              <span class="amount"><CurrencyEuroIcon class="h-4 w-4 inline mr-1" /> {{ doc.montantTTC }} €</span>
            </div>
          </div>
          <div class="doc-footer">
            <div class="btn-group-row" v-if="doc.pdfPath">
              <a :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn btn-sm btn-glass">
                <ArrowDownTrayIcon class="h-4 w-4 mr-1" /> Télécharger
              </a>
              <button @click="printDoc(doc.pdfPath)" class="btn btn-sm btn-glass">
                <PrinterIcon class="h-4 w-4 mr-1" /> Imprimer
              </button>
            </div>
            <span v-else class="text-muted small">Génération en cours...</span>
          </div>
        </div>
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
  CalendarIcon, 
  CurrencyEuroIcon, 
  ArrowDownTrayIcon, 
  PrinterIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline';

const user = ref({});
const docs = ref([]);
const loading = ref(true);

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchDocuments();
  }
});

const fetchDocuments = async () => {
  loading.value = true;
  try {
    const userId = user.value.id || user.value._id;
    // Approved documents are those where status is 'APPROUVE'
    const res = await axios.get(`http://localhost:5000/api/documentCommerciaux?client=${userId}`);
    docs.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const approvedDocs = computed(() => {
  return docs.value.filter(d => d.statut === 'APPROUVE');
});

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const printDoc = (path) => {
  const win = window.open('http://localhost:5000' + path, '_blank');
  win.focus();
  // Most browsers will show the PDF with its own print button, 
  // but this is a nice explicit shortcut if the user wants it.
};
</script>

<style scoped>
.header-split { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.filters { display: flex; gap: 10px; padding: 5px; width: fit-content; margin-bottom: 30px; border-radius: 12px; }
.filter-btn { background: transparent; border: none; padding: 8px 16px; border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: 0.3s; font-weight: 600; }
.filter-btn.active { background: rgba(0,0,0,0.05); color: var(--text-main); }

.docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.doc-card { padding: 25px; display: flex; flex-direction: column; gap: 20px; transition: transform 0.3s; }
.doc-card:hover { transform: translateY(-5px); border-color: var(--primary); }

.doc-icon { font-size: 32px; background: rgba(255,255,255,0.03); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 15px; }

.doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; }
.doc-header h4 { margin: 0; font-size: 16px; font-weight: 700; }

.status-pill { padding: 3px 10px; border-radius: 20px; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
.status-pill.active { background: rgba(0, 230, 118, 0.1); color: #00e676; }

.doc-meta { display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); }
.amount { color: var(--secondary); font-weight: 700; }

.payment-pill { padding: 3px 10px; border-radius: 4px; font-size: 10px; text-transform: uppercase; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); }
.payment-pill.paye { background: rgba(0, 230, 118, 0.1); color: #00e676; border-color: rgba(0, 230, 118, 0.2); }
.payment-pill.non_paye { background: rgba(255, 193, 7, 0.1); color: #ffc107; border-color: rgba(255, 193, 7, 0.2); }

.btn-glass { background: rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.1); color: var(--text-main); flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; gap: 5px; text-decoration: none; font-size: 11px; }
.btn-glass:hover { background: rgba(0,0,0,0.1); border-color: var(--primary); }

.btn-group-row { display: flex; gap: 10px; width: 100%; }

.empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
.loading { text-align: center; padding: 40px; color: var(--secondary); font-weight: 600; }
</style>
