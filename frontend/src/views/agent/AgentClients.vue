<template>
  <div class="agent-clients-page">
    <div class="header-split">
      <div>
        <h2>Mes Clients</h2>
        <p class="subtitle">Liste des clients qui vous sont assignés.</p>
      </div>
      <div class="header-actions">
        <button @click="fetchClients" class="btn-sm btn-outline refresh-btn" title="Actualiser">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Actualiser
        </button>
        <div class="search-box glass">
          <input v-model="searchQuery" placeholder="Rechercher un client..." class="search-input">
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Chargement...</div>

    <div v-else-if="filteredClients.length === 0" class="empty-state card glass">
      <p>Aucun client trouvé.</p>
    </div>

    <div v-else class="clients-grid">
      <div v-for="client in filteredClients" :key="client._id" class="client-card glass card">
        <div class="client-badge">{{ client.entreprise?.charAt(0) || 'C' }}</div>
        <div class="client-info">
          <h3>{{ client.entreprise || 'Entreprise N/A' }}</h3>
          <p class="client-name">{{ client.prenom }} {{ client.nom }}</p>
          <div class="client-meta">
            <span><EnvelopeIcon class="h-4 w-4 inline mr-1" /> {{ client.email }}</span>
            <span><PhoneIcon class="h-4 w-4 inline mr-1" /> {{ client.telephone || 'Non renseigné' }}</span>
            <span><DocumentTextIcon class="h-4 w-4 inline mr-1" /> MF: {{ client.matriculeFiscale || 'N/A' }}</span>
          </div>
        </div>
        <div class="client-actions">
          <button @click="openSocialLinksModal(client)" class="btn-sm btn-outline">Réseaux</button>
          <button @click="goToPortfolio(client._id)" class="btn-sm btn-secondary">Portfolio</button>
          <button @click="openAppointmentModal(client)" class="btn-sm btn-primary">Nouveau RDV</button>
        </div>
      </div>
    </div>

    <!-- SIMPLE APPOINTMENT MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content glass">
        <h3>Nouveau RDV avec {{ selectedClientForRDV?.entreprise }}</h3>
        <form @submit.prevent="createAppointment">
          <div class="form-group">
            <label>Type de RDV</label>
            <select v-model="rdvForm.type" class="glass-input" required>
              <option value="Consultation">Consultation</option>
              <option value="Suivi de Projet">Suivi de Projet</option>
              <option value="Présentation">Présentation</option>
              <option value="Brainstorming">Brainstorming</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date et Heure</label>
            <input type="datetime-local" v-model="rdvForm.dateProposee" class="glass-input" required>
          </div>
          <div class="modal-buttons">
            <button type="button" @click="showModal = false" class="btn btn-neutral">Annuler</button>
            <button type="submit" class="btn btn-primary">Confirmer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- SOCIAL LINKS MODAL -->
    <div v-if="showSocialModal" class="modal-overlay" @click.self="showSocialModal = false">
      <div class="modal-content glass">
        <h3>Réseaux Sociaux - {{ selectedClientForSocial?.entreprise }}</h3>
        <p class="modal-desc">Configurez les liens vers les réseaux sociaux du client.</p>
        <form @submit.prevent="saveSocialLinks">
          <div class="form-group">
            <label>Facebook</label>
            <input v-model="socialForm.facebook" placeholder="https://facebook.com/..." class="glass-input">
          </div>
          <div class="form-group">
            <label>Instagram</label>
            <input v-model="socialForm.instagram" placeholder="https://instagram.com/..." class="glass-input">
          </div>
          <div class="form-group">
            <label>LinkedIn</label>
            <input v-model="socialForm.linkedin" placeholder="https://linkedin.com/..." class="glass-input">
          </div>
          <div class="form-group">
            <label>X (Twitter)</label>
            <input v-model="socialForm.twitter" placeholder="https://x.com/..." class="glass-input">
          </div>
          <div class="form-group">
            <label>Site Web</label>
            <input v-model="socialForm.website" placeholder="https://example.com" class="glass-input">
          </div>
          <div class="modal-buttons">
            <button type="button" @click="showSocialModal = false" class="btn btn-neutral">Annuler</button>
            <button type="submit" class="btn btn-primary" :disabled="savingSocial">{{ savingSocial ? 'Enregistrement...' : 'Enregistrer' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { EnvelopeIcon, PhoneIcon, DocumentTextIcon } from '@heroicons/vue/24/outline';

const clients = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const router = useRouter();
const user = ref({});

const showModal = ref(false);
const selectedClientForRDV = ref(null);
const rdvForm = ref({
  type: 'Consultation',
  dateProposee: ''
});

const showSocialModal = ref(false);
const selectedClientForSocial = ref(null);
const savingSocial = ref(false);
const socialForm = ref({
  facebook: '',
  instagram: '',
  linkedin: '',
  twitter: '',
  website: ''
});

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchClients();
  }
});

const fetchClients = async () => {
  try {
    loading.value = true;
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/agents/my-clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    clients.value = res.data;
    console.log('Fetched clients:', clients.value);
  } catch (err) {
    console.error("Error fetching clients", err);
  } finally {
    loading.value = false;
  }
};

const filteredClients = computed(() => {
  return clients.value.filter(c => 
    c.entreprise?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.nom?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.prenom?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const goToPortfolio = (clientId) => {
  router.push({ name: 'AgentPortfolio', query: { client: clientId } });
};

const openAppointmentModal = (client) => {
  selectedClientForRDV.value = client;
  showModal.value = true;
};

const createAppointment = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/rendezvous', {
      client: selectedClientForRDV.value._id,
      agent: user.value._id || user.value.id,
      ...rdvForm.value,
      statut: 'confirmé'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    alert("Rendez-vous créé !");
    showModal.value = false;
    rdvForm.value = { type: 'Consultation', dateProposee: '' };
  } catch (err) {
    console.error("Error creating appointment", err);
    alert("Erreur lors de la création du RDV");
  }
};

const openSocialLinksModal = (client) => {
  selectedClientForSocial.value = client;
  socialForm.value = {
    facebook: client.socialLinks?.facebook || '',
    instagram: client.socialLinks?.instagram || '',
    linkedin: client.socialLinks?.linkedin || '',
    twitter: client.socialLinks?.twitter || '',
    website: client.socialLinks?.website || ''
  };
  showSocialModal.value = true;
};

const saveSocialLinks = async () => {
  savingSocial.value = true;
  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:5000/api/clients/${selectedClientForSocial.value._id}/social-links`, socialForm.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Update local data
    const index = clients.value.findIndex(c => c._id === selectedClientForSocial.value._id);
    if (index !== -1) {
      clients.value[index].socialLinks = { ...socialForm.value };
    }
    
    alert("Liens réseaux sociaux enregistrés !");
    showSocialModal.value = false;
  } catch (err) {
    console.error("Error saving social links", err);
    alert("Erreur lors de l'enregistrement");
  } finally {
    savingSocial.value = false;
  }
};
</script>

<style scoped>
.header-split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.search-box {
  padding: 5px 15px;
  border-radius: 20px;
}

.search-input {
  background: transparent;
  border: none;
  color: var(--text-main);
  padding: 8px;
  width: 250px;
  outline: none;
}

.clients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.client-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  transition: transform 0.3s;
}

.client-card:hover {
  transform: translateY(-5px);
}

.client-badge {
  width: 60px;
  height: 60px;
  background: var(--primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: white;
  box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.3);
}

.client-info h3 { margin: 0; font-size: 18px; }
.client-name { margin: 5px 0; color: var(--text-muted); font-size: 14px; }

.client-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 10px;
}

.client-actions {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 100px;
  color: var(--text-muted);
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 450px;
  padding: 40px;
  border-top: 4px solid var(--primary);
}

.modal-content h3 { margin-top: 0; margin-bottom: 25px; }

.glass-input {
  width: 100%;
  padding: 12px;
  background: rgba(0,0,0,0.05);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-main);
  margin-bottom: 15px;
}

.modal-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-neutral { background: rgba(0,0,0,0.05); color: var(--text-main); }
.btn-outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }
.btn-outline:hover { background: var(--primary); color: white; }
.modal-desc { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
.modal-content { background: white; }
</style>
