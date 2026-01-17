<template>
  <div class="admin-templates fade-in">
    <div class="header-split">
      <div>
        <h2>Modèles de Documents</h2>
        <p class="subtitle">Gérez les templates HTML/CSS pour les factures et devis.</p>
      </div>
      <button class="btn btn-primary" @click="openModal(null)">+ Nouveau Template</button>
    </div>

    <div class="templates-grid">
      <div v-for="tpl in templates" :key="tpl._id" class="card glass tpl-card">
        <div class="tpl-info">
          <h3>{{ tpl.nomTemplate }}</h3>
          <p>{{ tpl.description }}</p>
          <div class="tpl-meta">
            <span :class="['status-pill', tpl.actif ? 'approuve' : 'refuse']">
              {{ tpl.actif ? 'Actif' : 'Inactif' }}
            </span>
            <span class="date">Dernière modif: {{ formatDate(tpl.updatedAt) }}</span>
          </div>
        </div>
        <div class="tpl-actions">
          <button class="btn-icon" @click="openModal(tpl)">✏️</button>
          <button class="btn-icon delete" @click="deleteTemplate(tpl._id)">🗑️</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT/CREATE -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content glass large">
        <h3>{{ editingId ? 'Modifier Template' : 'Nouveau Template' }}</h3>
        <form @submit.prevent="saveTemplate">
          <div class="form-row">
            <div class="form-group half">
              <label>Nom du Template</label>
              <input v-model="form.nomTemplate" required class="glass-input">
            </div>
            <div class="form-group half">
              <label>Type de Template</label>
               <select v-model="form.typeTemplate" class="glass-input">
                <option value="PDF">Fichier PDF (Overlay)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Statut</label>
              <select v-model="form.actif" class="glass-input">
                <option :value="true">Actif</option>
                <option :value="false">Inactif</option>
              </select>
            </div>
             <div class="form-group half" v-if="form.typeTemplate === 'PDF'">
              <label>Fichier PDF (Template)</label>
              <input type="file" @change="handleFileUpload" accept=".pdf" class="glass-input">
              <small v-if="form.pdfTemplatePath" class="text-success">Fichier actuel: {{ form.pdfTemplatePath.split('/').pop() }}</small>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <input v-model="form.description" required class="glass-input">
          </div>

          <div class="form-group">
  <label>Template PDF</label>

  <input
    type="file"
    ref="fileInput"
    accept="application/pdf"
    hidden
    @change="handleFileUpload"
  />

  <small v-if="form.pdfTemplatePath">
    Current file: {{ form.pdfTemplatePath.split('/').pop() }}
  </small>
</div>

          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn btn-secondary">Annuler</button>
            <button type="submit" class="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
const isDragging = ref(false);
const fileInput = ref(null);
const templates = ref([]);
const showModal = ref(false);
const editingId = ref(null);
const form = ref({
  nomTemplate: '',
  description: '',
  typeTemplate: 'PDF',
  pdfTemplatePath: '',
  actif: true
});

const selectedFile = ref(null);

onMounted(fetchTemplates);

async function fetchTemplates() {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/templateDocuments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    templates.value = res.data;
  } catch (err) {
    console.error(err);
  }
}

function handleFileUpload(e) {
    selectedFile.value = e.target.files[0];
}

function openModal(tpl) {
  selectedFile.value = null;
  if (tpl) {
    editingId.value = tpl._id;
    form.value = { ...tpl };
  } else {
    editingId.value = null;
    form.value = {
      nomTemplate: '',
      description: '',
      contenueHTML: '',
      styleCSS: '',
      typeTemplate: 'PDF',
      pdfTemplatePath: '',
      actif: true
    };
  }
  showModal.value = true;
}

async function saveTemplate() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const formData = new FormData();
    formData.append('nomTemplate', form.value.nomTemplate);
    formData.append('description', form.value.description);
    formData.append('typeTemplate', form.value.typeTemplate);
    formData.append('actif', form.value.actif);    
    if (selectedFile.value) {
        formData.append('pdfTemplate', selectedFile.value);
    }

    const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
    };

    if (editingId.value) {
      await axios.put(`http://localhost:5000/api/templateDocuments/${editingId.value}`, formData, { headers });
    } else {
      await axios.post('http://localhost:5000/api/templateDocuments', formData, { headers });
    }
    showModal.value = false;
    fetchTemplates();
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l'enregistrement");
  }
}

async function deleteTemplate(id) {
  if (confirm("Supprimer ce template ?")) {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/templateDocuments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR');
}
</script>

<style scoped>
  .pdf-dropzone {
  border: 2px dashed var(--primary);
  border-radius: 14px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: 0.3s;
  background: rgba(255,255,255,0.03);
}

.pdf-dropzone.active {
  background: rgba(255,0,0,0.08);
  border-color: var(--secondary);
}

.file-name {
  font-weight: bold;
  color: var(--success);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 30px;
}
.tpl-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
}
.tpl-info h3 { margin: 0 0 5px 0; font-size: 18px; }
.tpl-info p { margin: 0 0 15px 0; color: var(--text-muted); font-size: 14px; }
.tpl-meta { display: flex; align-items: center; gap: 15px; }
.date { font-size: 12px; color: var(--text-muted); }

.tpl-actions { display: flex; gap: 10px; }

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
.code-editor {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
  background: rgba(0,0,0,0.3) !important;
}

.help { color: var(--secondary); font-size: 11px; margin-top: 5px; display: block; }

.modal-content.large { width: 900px; max-width: 95vw; }
</style>
