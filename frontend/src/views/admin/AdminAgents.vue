<template>
  <div class="agents-manager">
    <div class="header-actions">
      <h3>Gestion des Agents</h3>
      <button v-if="!showForm" @click="openForm()" class="btn btn-primary">
        + Nouvel Agent
      </button>
    </div>

    <!-- AGENT FORM (Toggleable) -->
    <div v-if="showForm" class="form-card glass fade-in">
      <h4>Créer un nouveau compte Agent</h4>
      <form @submit.prevent="createAgent">
        <div class="form-row">
          <div class="form-group half">
            <label>Prénom</label>
            <input v-model="form.prenom" required class="glass-input">
          </div>
          <div class="form-group half">
            <label>Nom</label>
            <input v-model="form.nom" required class="glass-input">
          </div>
        </div>

        <div class="form-row">
            <div class="form-group half">
                <label>Email</label>
                <input v-model="form.email" type="email" required class="glass-input">
            </div>
            <div class="form-group half">
                <label>Téléphone</label>
                <input v-model="form.telephone" required class="glass-input">
            </div>
        </div>

        <div class="form-row">
            <div class="form-group half">
                <label>Mot de Passe</label>
                <input v-model="form.motDePasse" type="password" required class="glass-input">
            </div>
            <div class="form-group half">
                <label>Spécialité</label>
                <input v-model="form.specialite" placeholder="Ex: SEO, Design..." required class="glass-input">
            </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeForm" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">Créer l'agent</button>
        </div>
      </form>
    </div>

    <!-- AGENTS LIST -->
    <div class="grid-3" v-if="!loading">
      <div v-for="agent in agents" :key="agent._id" class="card glass agent-card">
        <div class="agent-avatar">
            {{ agent.prenom.charAt(0) }}{{ agent.nom.charAt(0) }}
        </div>
        <h4>{{ agent.prenom }} {{ agent.nom }}</h4>
        <p class="role-badge">{{ agent.specialite || 'Généraliste' }}</p>
        
        <div class="contact-info">
            <p><EnvelopeIcon class="h-4 w-4 inline" /> <br> {{ agent.email }}</p>
            <p><PhoneIcon class="h-4 w-4 inline" /> <br>{{ agent.telephone }}</p>
        </div>
        
        <div class="agent-actions mt-15">
            <button @click="openLoginInfo(agent)" class="btn-xs btn-primary" title="Infos Connexion"><KeyIcon class="h-4 w-4" /></button>
            <button @click="deleteAgent(agent._id)" class="btn-xs btn-danger" title="Supprimer"><TrashIcon class="h-4 w-4" /></button>
        </div>
      </div>
    </div>
    <div v-else class="loading">Chargement...</div>
    
    <div v-if="!loading && agents.length === 0" class="empty-state">
        Aucun agent enregistré.
    </div>

    <!-- LOGIN INFO MODAL -->
    <div v-if="showLoginModal" class="modal-overlay">
        <div class="modal card glass fade-in">
            <h3>Identifiants Agent</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">Email de connexion:</span>
                    <span class="value">{{ selectedAgent?.email }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Rôle système:</span>
                    <span class="value">Agent / Collaborateur</span>
                </div>
                <div class="info-item">
                    <span class="label">Spécialité:</span>
                    <span class="value">{{ selectedAgent?.specialite || 'Général' }}</span>
                </div>
                <div class="info-item">
                    <span class="label">ID Unique:</span>
                    <span class="value small-id">{{ selectedAgent?._id }}</span>
                </div>
            </div>
            <div class="modal-actions mt-20">
                <button @click="showLoginModal = false" class="btn btn-primary">Fermer</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import { EnvelopeIcon, PhoneIcon, KeyIcon, TrashIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'AdminAgents',
  components: { EnvelopeIcon, PhoneIcon, KeyIcon, TrashIcon },
  data() {
    return {
      agents: [],
      loading: false,
      showForm: false,
      showLoginModal: false,
      selectedAgent: null,
      form: {
        nom: '', prenom: '', email: '', telephone: '', motDePasse: '', specialite: ''
      }
    }
  },
  mounted() {
    this.fetchAgents();
  },
  methods: {
    openLoginInfo(agent) {
        this.selectedAgent = agent;
        this.showLoginModal = true;
    },
    async fetchAgents() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        // Assuming there's a route GET /api/agents or users?role=agent
        // The previous file scan showed agent.routes.js exists.
        const res = await axios.get('http://localhost:5000/api/agents', {
             headers: { Authorization: `Bearer ${token}` }
        });
        this.agents = res.data;
      } catch (err) {
        console.error("Error fetching agents", err);
      } finally {
        this.loading = false;
      }
    },
    openForm() {
      this.resetForm();
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
    },
    resetForm() {
      this.form = { nom: '', prenom: '', email: '', telephone: '', motDePasse: '', specialite: '' };
    },
    async createAgent() {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/agents', this.form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Agent créé avec succès !');
            this.closeForm();
            this.fetchAgents();
        } catch (err) {
            alert('Erreur: ' + (err.response?.data?.message || err.message));
        }
    },
    async deleteAgent(id) {
        if(!confirm("Êtes-vous sûr de vouloir supprimer cet agent ?")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/agents/${id}`, {
                 headers: { Authorization: `Bearer ${token}` }
            });
            this.fetchAgents();
        } catch (err) {
            console.error(err);
        }
    }
  }
}
</script>

<style scoped>
.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.agent-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width:300px
}

.agent-avatar {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 15px;
    box-shadow: 0 5px 15px rgba(108, 93, 211, 0.3);
}

.role-badge {
    background: rgba(255,255,255,0.05);
    padding: 5px 12px;
    border-radius: 15px;
    font-size: 12px;
    margin-bottom: 20px;
}

.contact-info {
    font-size: 14px;
    color: var(--text-muted);
}

.mt-15 { margin-top: 15px; }
.h-4.w-4.inline {
  width: 30px;
  align-items: center;
}

/* FORM */
.form-card {
    padding: 30px;
    margin-bottom: 30px;
    max-width: 700px;
    border-left: 4px solid var(--primary);
}

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-size: 13px; color: var(--text-muted); }

.glass-input {
  width: 100%;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: rgb(0, 0, 0);
}

.agent-actions { display: flex; gap: 10px; width: 100PX; }
.agent-actions button { flex: 2; }

/* MODAL */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal { width: 400px; padding: 30px; }
.modal h3 { margin-bottom: 20px; text-align: center; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

.info-list { display: flex; flex-direction: column; gap: 15px; text-align: left; }
.info-item { display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.info-item .label { color: var(--text-muted); font-size: 13px; }
.info-item .value { font-weight: 600; font-size: 14px; }
.small-id { font-family: monospace; font-size: 11px !important; opacity: 0.6; }
.mt-20 { margin-top: 20px; }
</style>
