<template>
  <div class="demandes-page">
    <div class="header-action">
      <h2>Gestion Facturation</h2>
      <button class="btn btn-primary" @click="openCreateModal">
        <PlusIcon class="h-5 w-5" /> Nouvelle Facture
      </button>
    </div>

    <!-- DOCUMENT LIST -->
    <div class="documents-grid">
       <div v-for="doc in documents" :key="doc._id" class="doc-card glass">
          <div class="doc-header">
             <span class="doc-ref">{{ doc.reference }}</span>
             <span class="badg" :class="doc.typeDocument">{{ doc.typeDocument }}</span>
          </div>
          <div class="doc-body">
             <h4>{{ doc.clientId?.entreprise || doc.clientId?.nom }}</h4>
             <p class="amount">{{ doc.montantTTC.toFixed(2) }} TND</p>
             <p class="date">{{ new Date(doc.createdAt).toLocaleDateString() }}</p>
          </div>
          <div class="doc-actions">
              <div v-if="doc.isCustomRequest && doc.statut === 'EN_ATTENTE_AGENT'">
                 <button @click="openProposalModal(doc)" class="btn-icon action">
                    <PencilSquareIcon class="h-5 w-5" /> Traiter
                 </button>
              </div>
              <div v-else>
                  <a v-if="doc.pdfPath" :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn-icon">
                     <ArrowDownTrayIcon class="h-5 w-5" /> Télécharger
                  </a>

                  <!-- START: Agent Validation for Standard Requests -->
                  <button v-if="!doc.isCustomRequest && doc.statut === 'EN_ATTENTE'" @click="validateStandard(doc._id)" class="btn-icon success ml-2">
                     <CheckIcon class="h-5 w-5" /> Valider
                  </button>
                  <!-- END: Agent Validation for Standard Requests -->
                  
                  <!-- Agent can Complete Approved Docs -->
                  <button v-if="doc.statut === 'APPROUVE'" @click="markAsCompleted(doc._id)" class="btn-icon success ml-2">
                     <CheckBadgeIcon class="h-5 w-5" /> Terminer
                  </button>

                  <span v-else-if="doc.statut === 'EN_ATTENTE_ADMIN'" class="badge-pending">En Attente Admin</span>
                  <span v-else-if="doc.statut === 'TERMINE'" class="badge-done">Terminé</span>
              </div>
              <button @click="deleteDoc(doc._id)" class="btn-icon danger">
                 <TrashIcon class="h-5 w-5" />
              </button>
           </div>
       </div>
    </div>

    <!-- CREATE MODAL -->
    <div v-if="showModal" class="modal-overlay">
       <div class="modal-content glass">
          <h3>Créer un Document</h3>
          
          <div class="form-group">
             <label>Client</label>
             <select v-model="form.clientId" class="glass-input">
                <option v-for="c in clients" :value="c._id" :key="c._id">
                   {{ c.entreprise }} ({{ c.nom }} {{ c.prenom }})
                </option>
             </select>
          </div>

          <div class="form-group half">
             <label>Type</label>
             <select v-model="form.typeDocument" class="glass-input">
                <option value="FACTURE">Facture</option>
                <option value="DEVIS">Devis</option>
             </select>
          </div>

          <!-- ITEMS -->
          <div class="items-section">
             <h4>Prestations</h4>
             <div v-for="(item, index) in form.items" :key="index" class="item-row">
                <input v-model="item.reference" placeholder="Ref" class="glass-input small">
                <input v-model="item.description" placeholder="Description" class="glass-input wide">
                <input type="number" v-model.number="item.quantite" placeholder="Qty" class="glass-input tiny">
                <input type="number" v-model.number="item.prixUnitaire" placeholder="Prix HT" class="glass-input small">
                <button @click="removeItem(index)" class="btn-text damage">X</button>
             </div>
             <button @click="addItem" class="btn-text">+ Ajouter ligne</button>
          </div>

          <div class="totals-section">
             <label>TVA (%) <input type="number" v-model.number="form.tva" class="glass-input tiny"></label>
             <p>Total HT: {{ totalHT }}</p>
             <p class="total-big">Total TTC: {{ totalTTC }}</p>
          </div>

          <div class="modal-actions">
             <button @click="showModal = false" class="btn btn-secondary">Annuler</button>
             <button @click="createDocument" class="btn btn-success" :disabled="loading">
                {{ loading ? 'Génération...' : 'Créer & Générer PDF' }}
             </button>
          </div>

       </div>

    </div>

    <!-- PROPOSAL MODAL -->
    <div v-if="showProposalModal" class="modal-overlay">
       <div class="modal-content glass">
          <h3>Traitement Demande Personnalisée</h3>
          <div class="client-suggestion card glass mb-20">
             <h4>Besoin du client :</h4>
             <p>"{{ currentDoc.clientSuggestion }}"</p>
          </div>

          <div class="form-group">
             <label>Description du Service (pour le Devis)</label>
             <input v-model="proposalForm.description" class="glass-input" placeholder="Ex: Développement Module X..." required>
          </div>

          <div class="form-group">
             <label>Détails Techniques / Livrables Spéciaux</label>
             <textarea v-model="proposalForm.details" class="glass-input" rows="3" placeholder="Détails pour l'admin..."></textarea>
          </div>

          <div class="form-group half">
             <label>Prix Proposé (HT)</label>
             <input type="number" v-model.number="proposalForm.prixPropose" class="glass-input" required>
          </div>

          <div class="modal-actions">
             <button @click="showProposalModal = false" class="btn btn-secondary">Annuler</button>
             <button @click="submitProposal" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? 'Envoi...' : 'Soumettre à l\'Admin' }}
             </button>
          </div>
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { PlusIcon, ArrowDownTrayIcon, TrashIcon, PencilSquareIcon, CheckBadgeIcon } from '@heroicons/vue/24/outline';

const documents = ref([]);
const clients = ref([]);
const showModal = ref(false);
const showProposalModal = ref(false);
const loading = ref(false);
const submitting = ref(false);
const currentDoc = ref(null);

const proposalForm = ref({
  description: '',
  details: '',
  prixPropose: 0
});

const form = ref({
  clientId: '',
  typeDocument: 'FACTURE',
  tva: 19,
  items: [{ reference: '', description: '', quantite: 1, prixUnitaire: 0 }]
});

// Computed Totals
const totalHT = computed(() => {
   return form.value.items.reduce((acc, i) => acc + (i.quantite * i.prixUnitaire), 0).toFixed(2);
});
const totalTTC = computed(() => {
   return (totalHT.value * (1 + form.value.tva/100)).toFixed(2);
});

onMounted(async () => {
   await fetchDocs();
   await fetchClients();
});

const fetchDocs = async () => {
   const token = localStorage.getItem('token');
   const res = await axios.get('http://localhost:5000/api/documentCommerciaux', {
      headers: { Authorization: `Bearer ${token}` }
   });
   documents.value = res.data;
};

const fetchClients = async () => {
   const token = localStorage.getItem('token');
   const res = await axios.get('http://localhost:5000/api/users?role=client', {
      headers: { Authorization: `Bearer ${token}` }
   });
   clients.value = res.data;
};

const openCreateModal = () => {
   form.value = {
     clientId: '', 
     typeDocument: 'FACTURE',
     tva: 19,
     items: [{ reference: '', description: '', quantite: 1, prixUnitaire: 0 }]
   };
   showModal.value = true;
};

const addItem = () => form.value.items.push({ description: '', quantite: 1, prixUnitaire: 0 });
const removeItem = (i) => form.value.items.splice(i, 1);

const createDocument = async () => {
   if (!form.value.clientId) return alert('Sélectionnez un client');
   loading.value = true;
   try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/documentCommerciaux', form.value, {
         headers: { Authorization: `Bearer ${token}` }
      });
      showModal.value = false;
      await fetchDocs();
   } catch (e) {
      console.error(e);
      alert('Erreur: ' + (e.response?.data?.message || e.message));
   } finally {
      loading.value = false;
   }
};

const deleteDoc = async (id) => {
   if(confirm('Supprimer ?')) {
       await axios.delete(`http://localhost:5000/api/documentCommerciaux/${id}`, {
           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       await fetchDocs();
   }
}

const openProposalModal = (doc) => {
   currentDoc.value = doc;
   proposalForm.value = {
      description: doc.clientSuggestion || '',
      details: '',
      prixPropose: 0
   };
   showProposalModal.value = true;
};

const submitProposal = async () => {
   submitting.value = true;
   try {
       const token = localStorage.getItem('token');
       await axios.put(`http://localhost:5000/api/documentCommerciaux/${currentDoc.value._id}/proposal`, proposalForm.value, {
            headers: { Authorization: `Bearer ${token}` }
       });
       showProposalModal.value = false;
       await fetchDocs();
       alert("Proposition envoyée à l'administrateur !");
   } catch(e) {
       console.error(e);
       alert("Erreur lors de l'envoi");
   } finally {
       submitting.value = false;
   }
};

const markAsCompleted = async (id) => {
    if(!confirm("Marquer ce livrable comme terminé / livré ?")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/documentCommerciaux/${id}/complete`, {}, {
             headers: { Authorization: `Bearer ${token}` }
        });
        await fetchDocs();
        alert("Livrable marqué comme terminé !");
    } catch(e) {
        console.error(e);
        alert("Erreur lors de la validation");
        alert("Erreur lors de la validation");
    }
};

const validateStandard = async (id) => {
    if(!confirm("Valider cette demande standard et l'envoyer au client ?")) return;
    try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:5000/api/documentCommerciaux/${id}/validate-standard`, {}, {
             headers: { Authorization: `Bearer ${token}` }
        });
        await fetchDocs();
        alert("Document validé et envoyé !");
    } catch(e) {
        alert("Erreur validation");
    }
};
</script>

<style scoped>
.demandes-page { padding: 20px; }
.header-action { display: flex; justify-content: space-between; margin-bottom: 30px; }

.documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

.doc-card { 
    padding: 0;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease-in-out;
}
.doc-card:hover { 
    transform: translateY(-4px); 
    box-shadow: var(--shadow-md); 
    border-color: var(--primary); 
}

.doc-header { 
    background: var(--bg-element); 
    padding: 12px 20px; 
    border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
}
.doc-ref { font-weight: 600; font-family: monospace; color: var(--text-muted); font-size: 13px; }

.doc-body { padding: 20px; flex: 1; }
.doc-body h4 { margin: 0 0 10px 0; font-size: 18px; color: var(--text-main); }
.amount { font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 5px; }
.date { font-size: 13px; color: var(--text-muted); }

.doc-actions { 
    padding: 15px 20px; 
    border-top: 1px solid var(--border); 
    background: var(--bg-body);
    display: flex; justify-content: space-between; align-items: center; 
}

.badg { font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.badg.FACTURE { background: rgba(0, 230, 118, 0.1); color: #059669; }
.badg.DEVIS { background: rgba(251, 197, 49, 0.1); color: #d97706; }

[data-theme="dark"] .badg.FACTURE { color: #34d399; }
[data-theme="dark"] .badg.DEVIS { color: #fbbf24; }


/* Modal Styles */
.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display:flex; justify-content: center; align-items:center; z-index:999; }
.modal-content { 
    width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; 
    padding: 30px; 
    border-radius: var(--radius-lg); 
    background: var(--bg-card); 
    color: var(--text-main); 
    border: 1px solid var(--border); 
    box-shadow: var(--shadow-md);
}

.form-group { margin-bottom: 20px; }
.item-row { display: flex; gap: 10px; margin-bottom: 10px; }
.small { width: 90px; } .tiny { width: 70px; } .wide { flex: 1; }

.totals-section { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
.total-big { font-size: 28px; font-weight: 800; color: var(--primary); }

.modal-actions { margin-top: 30px; display: flex; justify-content: flex-end; gap: 15px; }

/* Buttons */
.btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; display:flex; align-items:center; gap:8px; transition: 0.2s; }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; }
.btn-secondary { background: var(--bg-element); color: var(--text-main); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--bg-body); }

.btn-icon { 
    background: white; 
    padding: 8px 12px; 
    border-radius: 8px; 
    color: var(--text-main); 
    text-decoration: none; 
    display: inline-flex; gap: 6px; 
    cursor: pointer; 
    border: 1px solid var(--border);
    font-size: 13px; font-weight: 600;
    align-items: center;
}
.btn-icon:hover { border-color: var(--primary); background: var(--bg-element); color: var(--primary); }
.btn-icon.success:hover { border-color: #059669; color: #059669; }
.btn-icon.danger:hover { border-color: #ef4444; color: #ef4444; }

.btn-text { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; }
.damage { color: #ef4444; }

.badge-pending { font-size: 11px; background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 4px 8px; border-radius: 4px; font-weight: 700; }
.badge-done { font-size: 11px; background: rgba(16, 185, 129, 0.1); color: #059669; padding: 4px 8px; border-radius: 4px; font-weight: 700; }
.ml-2 { margin-left: 10px; }
.mb-20 { margin-bottom: 20px; padding: 15px; }
</style>
