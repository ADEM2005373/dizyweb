<template>
  <div class="client-docs">
    <div class="header-section">
      <h2>Documents Commerciaux</h2>
      <p class="subtitle">Retrouvez vos devis et factures.</p>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else class="docs-list glass">
      <div v-if="documents.length === 0" class="empty-state">
        Aucun document disponible.
      </div>

      <div v-else class="table-responsive">
         <table>
            <thead>
                <tr>
                    <th>Référence</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="doc in documents" :key="doc._id">
                    <td class="ref-cell">{{ doc.reference || 'N/A' }}</td>
                    <td>{{ doc.type }}</td>
                    <td>{{ new Date(doc.createdAt).toLocaleDateString() }}</td>
                    <td class="amount">{{ doc.montantTotal || 0 }} DT</td>
                    <td>
                        <span :class="['status-badge', doc.statut]">
                            {{ doc.statut }}
                        </span>
                    </td>
                    <td>
                        <button class="btn-sm btn-icon" title="Télécharger">
                            <ArrowDownTrayIcon class="h-4 w-4" />
                        </button>
                    </td>
                </tr>
            </tbody>
         </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline';

const documents = ref([]);
const loading = ref(true);
const user = ref(null);

onMounted(() => {
  user.value = JSON.parse(localStorage.getItem('user'));
  fetchDocuments();
});

const fetchDocuments = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:5000/api/documentCommerciaux?client=${user.value._id || user.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    documents.value = res.data;
  } catch (err) {
    console.error("Erreur chargement documents", err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.header-section { margin-bottom: 30px; }
.subtitle { color: var(--text-muted); }

.docs-list {
    padding: 20px;
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 10px;
}

th {
    text-align: left;
    color: var(--text-muted);
    padding: 10px;
    font-size: 13px;
    font-weight: 500;
}

td {
    background: rgba(0,0,0,0.05);
    padding: 15px 10px;
    font-size: 14px;
    color: var(--text-main);
}

tr td:first-child { border-radius: 8px 0 0 8px; }
tr td:last-child { border-radius: 0 8px 8px 0; }

.ref-cell { font-family: monospace; font-weight: 700; color: var(--secondary); }
.amount { font-weight: 700; }

.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
}

.status-badge.payée { background: rgba(0, 230, 118, 0.2); color: #00e676; }
.status-badge.en_attente { background: rgba(255, 193, 7, 0.2); color: #ffc107; }

.btn-sm {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.btn-sm:hover { opacity: 1; }

.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
}
</style>
