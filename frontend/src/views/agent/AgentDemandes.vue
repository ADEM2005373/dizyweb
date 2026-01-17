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
             <a :href="'http://localhost:5000' + doc.pdfPath" target="_blank" class="btn-icon">
                <ArrowDownTrayIcon class="h-5 w-5" /> Télécharger
             </a>
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { PlusIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/vue/24/outline';

const documents = ref([]);
const clients = ref([]);
const showModal = ref(false);
const loading = ref(false);

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
       await axios.delete(`http://localhost:5000/api/documentCommerciaux/${id}`);
       await fetchDocs();
   }
}
</script>

<style scoped>
.demandes-page { padding: 20px; color: white; }
.header-action { display: flex; justify-content: space-between; margin-bottom: 30px; }

.documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

.doc-card { 
    padding: 24px; 
    border-radius: 16px; 
    background: rgba(255, 255, 255, 0.1); 
    border: 1px solid rgba(255, 255, 255, 0.2); 
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    display: flex; 
    flex-direction: column; 
    gap: 15px; 
    transition: transform 0.2s, background 0.2s;
}
.doc-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
.doc-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.doc-ref { font-weight: 700; color: #ccc; font-size: 12px; }
.badg.FACTURE { color: #4cd137; }
.badg.DEVIS { color: #fbc531; }

.amount { font-size: 20px; font-weight: 700; color: white; }
.doc-actions { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }

.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content: center; align-items:center; z-index:999; }
.modal-content { width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; padding: 30px; border-radius: 16px; background: #1e1e1e; color: white; border: 1px solid #333; }

.glass-input { width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 8px; margin-top: 5px; outline: none; }
.glass-input option { background: #333; color: white; }
.form-group { margin-bottom: 15px; }

.item-row { display: flex; gap: 10px; margin-bottom: 10px; }
.small { width: 80px; } .tiny { width: 60px; } .wide { flex: 1; }

.totals-section { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 1px solid #333; }
.total-big { font-size: 24px; font-weight: 700; color: #4cd137; }

.btn { padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 600; display:flex; align-items:center; gap:8px; }
.btn-primary { background: #3c40c6; color: white; }
.btn-success { background: #4cd137; color: black; }
.btn-secondary { background: #576574; color: white; }
.btn-icon { background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; color: white; text-decoration: none; display: inline-flex; gap: 5px; cursor: pointer; border: none;}
.btn-icon:hover { background: white; color: black; }
.damage { color: #e84118; margin-left: 5px; }
</style>
