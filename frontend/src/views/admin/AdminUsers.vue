<template>
  <div class="users-manager">
    <div class="header-section">
      <h3>Gestion des Clients</h3>
      <div class="filters">
        <input v-model="search" placeholder="Rechercher..." class="glass-input search-bar">
      </div>
    </div>

    <div class="table-container card glass">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Email</th>
            <th>Matricule Fiscale</th>
            <th>Agent</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredClients" :key="user._id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ user.prenom.charAt(0) }}</div>
                <div>
                   <div class="fw-bold">{{ user.prenom }} {{ user.nom }}</div>
                   <div class="small-text">{{ user.entreprise || 'Particulier' }}</div>
                </div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.matriculeFiscale || 'N/A' }}</td>
            <td>
                <span class="agent-tag" @click="openAgentModal(user)">
                    {{ getAgentName(user.agentPrincipal) }} ✎
                </span>
            </td>
            <td>
              <span :class="['badge', user.isApproved ? 'active' : 'pending']">
                {{ user.isApproved ? 'Actif' : 'En attente' }}
              </span>
            </td>
            <td>
              <div class="actions">
                  <button v-if="!user.isApproved" @click="toggleApprove(user)" class="btn-icon check" title="Approuver">✅</button>
                  <button v-else @click="toggleApprove(user)" class="btn-icon ban" title="Désactiver">🚫</button>
                  <button @click="openLoginInfo(user)" class="btn-icon info" title="Infos Connexion">🔑</button>
                  <button @click="remove(user._id)" class="btn-icon trash" title="Supprimer">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredClients.length === 0" class="empty-state">
        Aucun client trouvé.
      </div>
    </div>

    <!-- ASSIGN AGENT MODAL -->
    <div v-if="showAgentModal" class="modal-overlay">
        <div class="modal card glass fade-in">
            <h3>Assigner un Agent</h3>
            <p>Pour le client: <strong>{{ selectedClient?.entreprise }}</strong></p>
            
            <div class="form-group">
                <label>Sélectionner un agent:</label>
                <select v-model="selectedAgentId" class="glass-input">
                    <option value="">-- Aucun --</option>
                    <option v-for="agent in agents" :key="agent._id" :value="agent._id">
                        {{ agent.prenom }} {{ agent.nom }} ({{ agent.specialite }})
                    </option>
                </select>
            </div>

            <div class="modal-actions">
                <button @click="showAgentModal = false" class="btn btn-secondary">Annuler</button>
                <button @click="assignAgent" class="btn btn-primary">Enregistrer</button>
            </div>
        </div>
    </div>

    <!-- LOGIN INFO MODAL -->
    <div v-if="showLoginModal" class="modal-overlay">
        <div class="modal card glass fade-in">
            <h3>Identifiants & Sécurité</h3>
            <div class="info-list">
                <div class="info-item">
                    <span class="label">Email de connexion:</span>
                    <span class="value">{{ selectedClient?.email }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Rôle système:</span>
                    <span class="value">Client</span>
                </div>
                <div class="info-item">
                    <span class="label">Date de création:</span>
                    <span class="value">{{ formatDate(selectedClient?.createdAt) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">ID Unique:</span>
                    <span class="value small-id">{{ selectedClient?._id }}</span>
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

export default {
  name: 'AdminUsers',
  data() {
    return {
      clients: [],
      agents: [],
      search: '',
      showAgentModal: false,
      showLoginModal: false,
      selectedClient: null,
      selectedAgentId: ""
    }
  },
  computed: {
    filteredClients() {
      if(!this.search) return this.clients;
      const s = this.search.toLowerCase();
      return this.clients.filter(c => 
        c.nom.toLowerCase().includes(s) || 
        c.prenom.toLowerCase().includes(s) || 
        c.email.toLowerCase().includes(s)
      );
    }
  },
  mounted() {
    this.fetchClients();
    this.fetchAgents();
  },
  methods: {
    formatDate(date) {
        if(!date) return 'N/A';
        return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    },
    openLoginInfo(user) {
        this.selectedClient = user;
        this.showLoginModal = true;
    },
    async fetchClients() {
      try {
        const token = localStorage.getItem('token');
        // Use our new User API, populate agentPrincipal to show current assignment
        const res = await axios.get('http://localhost:5000/api/users?role=client', {
             headers: { Authorization: `Bearer ${token}` }
        });
        this.clients = res.data;
      } catch (err) {
        console.error("Error fetching clients", err);
      }
    },
    async fetchAgents() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users?role=agent', {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.agents = res.data;
        } catch (err) {
            console.error(err);
        }
    },
    openAgentModal(client) {
        this.selectedClient = client;
        // Handle populated object or raw ID
        if (client.agentPrincipal && typeof client.agentPrincipal === 'object') {
            this.selectedAgentId = client.agentPrincipal._id;
        } else {
            this.selectedAgentId = client.agentPrincipal || "";
        }
        this.showAgentModal = true;
    },
    async assignAgent() {
        if(!this.selectedClient) return;
        try {
            const token = localStorage.getItem('token');
            // Optimistically update to avoid waiting for refresh
            // But we need the BACKEND to confirm first.
            await axios.put(`http://localhost:5000/api/users/${this.selectedClient._id}`, {
                agentPrincipal: this.selectedAgentId,
                // Include validation bypass fields just in case
                matriculeFiscale: this.selectedClient.matriculeFiscale,
                entreprise: this.selectedClient.entreprise,
                secteur: this.selectedClient.secteur
            }, { headers: { Authorization: `Bearer ${token}` }});
            
            // Update local state - convert ID to "mock" object or just string?
            // getAgentName now handles both. Let's set it to the Object from agents list for consistency if possible, 
            // or just the ID if we rely on the list lookup.
            // If we set ID, getAgentName finds it.
            // If we set Object, getAgentName prints it.
            
            // Let's find the agent object to set it nicely
            const agentObj = this.agents.find(a => a._id === this.selectedAgentId);
            this.selectedClient.agentPrincipal = agentObj || this.selectedAgentId;

            this.showAgentModal = false;
            alert("Agent assigné avec succès !");
            // No need to fetchClients if we updated locally correctly, but safer to do so.
            // this.fetchClients(); 
        } catch(err) {
            console.error(err);
            alert("Erreur lors de l'assignation: " + (err.response?.data?.message || err.message));
        }
    },
    // ...
    // ... remove ...
    getAgentName(val) {
        if (!val) return 'Aucun';
        // If populated object
        if (typeof val === 'object' && val.prenom) {
            return `${val.prenom} ${val.nom}`; 
        }
        // If ID string
        const ag = this.agents.find(a => a._id === val);
        return ag ? `${ag.prenom} ${ag.nom}` : 'Aucun';
    }
  }
}
</script>

<style scoped>
.header-section {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;
}

.search-bar { width: 300px; padding: 10px; border-radius: 20px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: white; }

.table-container { padding: 0; overflow: hidden; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px 20px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
th { background: rgba(0,0,0,0.2); color: var(--text-muted); font-size: 13px; text-transform: uppercase; }

.user-cell { display: flex; align-items: center; gap: 15px; }
.avatar { width: 36px; height: 36px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; }

.fw-bold { font-weight: 600; }
.small-text { font-size: 12px; color: var(--text-muted); }

.badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.badge.active { background: rgba(0,230,118,0.2); color: #00e676; }
.badge.pending { background: rgba(255,193,7,0.2); color: #ffc107; }

.actions { display: flex; gap: 10px; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.7; transition: 0.2s; }
.btn-icon:hover { opacity: 1; transform: scale(1.1); }

.agent-tag {
    background: rgba(255,255,255,0.1);
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    border: 1px dashed var(--border);
    transition: 0.2s;
}
.agent-tag:hover { background: var(--primary); border-color: transparent; color: black; }

/* MODAL */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal { width: 400px; padding: 30px; }
.modal h3 { margin-bottom: 20px; text-align: center; }
.modal p { margin-bottom: 20px; text-align: center; color: var(--text-muted); }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 12px; color: var(--text-muted); }
.glass-input { width: 100%; padding: 12px; background: rgba(4, 4, 4, 0.3); border: 1px solid var(--border); border-radius: 8px; color: rgb(0, 0, 0); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

.info-list { display: flex; flex-direction: column; gap: 15px; }
.info-item { display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.info-item .label { color: var(--text-muted); font-size: 13px; }
.info-item .value { font-weight: 600; font-size: 14px; }
.small-id { font-family: monospace; font-size: 11px !important; opacity: 0.6; }
.mt-20 { margin-top: 20px; }
</style>
