<template>
  <div class="agent-portfolio-tool">
    <div class="header-split">
      <div>
        <h2>Gestion Portfolio Clients</h2>
        <p class="subtitle">Ajoutez des livrables (maquettes, rapports, fichiers).</p>
      </div>
    </div>

    <!-- SELECTION -->
    <div class="selection-area card glass">
      <h3>1. Sélectionner un Client</h3>
      <div v-if="clients.length === 0" class="empty-msg">
          Aucun client ne vous est assigné. Contactez l'administrateur.
      </div>
      <select v-else v-model="selectedClient" @change="fetchClientPortfolio" class="glass-input">
        <option :value="null">Choisir un client...</option>
        <option v-for="c in clients" :key="c._id" :value="c._id">
          {{ c.entreprise }} ({{ c.nom }} {{ c.prenom }})
        </option>
      </select>
    </div>

    <!-- UPLOAD FORM -->
    <div v-if="selectedClient && portfolioId" class="upload-area card glass fade-in">
       <h3>2. Ajouter un Élément</h3>
       <form @submit.prevent="addElement">
         <div class="form-row">
           <div class="form-group half">
             <label>Type de livré</label>
             <select v-model="form.type" class="glass-input">
               <option value="image">Image / Design</option>
               <option value="video">Vidéo / Démo</option>
               <option value="fichier">Fichier / Contenu</option>
               <option value="lien">Lien Externe</option>
             </select>
           </div>
           
           <div class="form-group half" v-if="form.type !== 'lien'">
             <label>Source</label>
             <div class="toggle-source">
               <button type="button" :class="{ active: sourceMode === 'file' }" @click="sourceMode = 'file'">Upload</button>
               <button type="button" :class="{ active: sourceMode === 'url' }" @click="sourceMode = 'url'">URL</button>
             </div>
           </div>
         </div>

         <div class="form-row">
            <div class="form-group full" v-if="sourceMode === 'file' && form.type !== 'lien'">
              <label>Fichier</label>
              <input type="file" @change="onFileChange" class="glass-input file-input" ref="fileInput">
            </div>
            <div class="form-group full" v-else>
              <label>URL / Lien</label>
              <input v-model="form.url" placeholder="https://..." :required="sourceMode === 'url' || form.type === 'lien'" class="glass-input">
            </div>
         </div>

         <div class="form-group">
            <label>Description du livrable</label>
            <input v-model="form.description" placeholder="Ex: Maquette Finale V2, Rapport SEO..." required class="glass-input">
         </div>
         
          <div class="form-group">
            <label>Service Associé (Pack)</label>
            <select v-model="form.serviceAssocie" required class="glass-input">
                <option v-for="pack in packs" :key="pack._id" :value="pack._id">
                    {{ pack.titre }}
                </option>
            </select>
          </div>
          
         <button type="submit" class="btn btn-primary" :disabled="uploading">
           {{ uploading ? 'Envoi en cours...' : 'Ajouter au Portfolio' }}
         </button>
       </form>
    </div>
    
    <div v-if="selectedClient && !portfolioId" class="init-area fade-in">
        <p>Ce client n'a pas encore de portfolio initialisé.</p>
        <button @click="createPortfolio" class="btn btn-secondary">Initialiser le Portfolio</button>
    </div>

    <!-- CURRENT ITEMS LIST -->
    <div v-if="portfolioItems.length" class="items-list pt-30">
        <h3>Éléments actuels</h3>
        <div class="list-grid">
            <div v-for="item in portfolioItems" :key="item._id" class="card glass item-card">
                <div class="item-icon"><PhotoIcon v-if="item.type === 'image'" class="h-6 w-6" /><LinkIcon v-else class="h-6 w-6" /></div>
                <div class="item-info">
                    <h4>{{ item.description }}</h4>
                    <a :href="item.url" target="_blank">{{ item.url }}</a>
                </div>
                <button @click="deleteItem(item._id)" class="btn-xs btn-danger">Supprimer</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import { PhotoIcon, LinkIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'AgentPortfolio',
  components: { PhotoIcon, LinkIcon },
  data() {
    return {
      user: null,
      clients: [],
      selectedClient: null,
      portfolioId: null,
      portfolioItems: [],
      packs: [], // Store available services
      sourceMode: 'file', // 'file' or 'url'
      selectedFile: null,
      uploading: false,
      form: {
        type: 'image',
        url: '',
        description: '',
        serviceAssocie: '' 
      }
    }
  },
  mounted() {
    const storedUser = localStorage.getItem('user');
    if(storedUser) {
        this.user = JSON.parse(storedUser);
        this.fetchClients();
        this.fetchPacks();
        
        // Check for client query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const clientParam = urlParams.get('client');
        if (clientParam) {
            // Wait for clients to load, then select the client
            this.$nextTick(() => {
                setTimeout(() => {
                    this.selectedClient = clientParam;
                    this.fetchClientPortfolio();
                }, 500); // Small delay to ensure clients are loaded
            });
        }
    }
  },
  methods: {
    async fetchPacks() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/packs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.packs = res.data.filter(p => p.actif);
            // Default selection
            if(this.packs.length > 0 && !this.form.serviceAssocie) this.form.serviceAssocie = this.packs[0]._id;
        } catch(err) {
            console.error(err);
        }
    },
    async fetchClients() {
      // Fetch clients assigned to current agent
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/agents/my-clients', {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        this.clients = res.data;
        
      } catch (err) {
        console.error(err);
      }
    },
    async fetchClientPortfolio() {
        if(!this.selectedClient) { 
            this.portfolioId = null; 
            this.portfolioItems = [];
            return; 
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/portfolios?client=${this.selectedClient}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.length > 0) {
                this.portfolioId = res.data[0]._id;
                this.fetchItems();
            } else {
                this.portfolioId = null;
                this.portfolioItems = [];
            }
        } catch (err) {
            console.error(err);
        }
    },
    async createPortfolio() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/portfolios', 
                { client: this.selectedClient },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // The API returns { message: "Portfolio créé", portfolio: { ... } }
            this.portfolioId = res.data.portfolio._id;
            alert("Portfolio initialisé !");
        } catch (err) {
             console.error(err);
             alert("Erreur lors de l'initialisation");
        }
    },
    async fetchItems() {
        if(!this.portfolioId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/elementPortfolios?portfolio=${this.portfolioId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.portfolioItems = res.data;
        } catch (err) {
            console.error(err);
        }
    },
    onFileChange(e) {
        this.selectedFile = e.target.files[0];
    },
    async addElement() {
        this.uploading = true;
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            formData.append('portfolio', this.portfolioId);
            formData.append('type', this.form.type);
            formData.append('description', this.form.description);
            formData.append('serviceAssocie', this.form.serviceAssocie);
            formData.append('date', new Date().toISOString());

            if (this.sourceMode === 'file' && this.selectedFile && this.form.type !== 'lien') {
                formData.append('file', this.selectedFile);
            } else {
                formData.append('url', this.form.url);
            }

            await axios.post('http://localhost:5000/api/elementPortfolios', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            this.form.description = '';
            this.form.url = '';
            this.selectedFile = null;
            if(this.$refs.fileInput) this.$refs.fileInput.value = '';
            
            this.fetchItems();
            alert("Élément ajouté !");
        } catch (err) {
            console.error(err);
            alert("Erreur ajout : " + (err.response?.data?.message || err.message));
        } finally {
            this.uploading = false;
        }
    },
    async deleteItem(id) {
        if(!confirm("Supprimer ?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/elementPortfolios/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.fetchItems();
        } catch(err) {
            console.error(err);
        }
    }
  }
}
</script>

<style scoped>
.selection-area, .upload-area { margin-bottom: 30px; padding: 25px; }
.selection-area h3, .upload-area h3 { margin-top: 0; font-size: 18px; margin-bottom: 15px; }

.glass-input {
    width: 100%;
    padding: 12px;
    background: rgba(0,0,0,0.05);
    border: 1px solid var(--border);
    color: var(--text-main);
    border-radius: 6px;
}

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-size: 13px; color: var(--text-muted); }

.pt-30 { padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); }

.list-grid {
    display: grid;
    gap: 15px;
}

.item-card {
    display: flex;
    align-items: center;
    padding: 15px;
    gap: 15px;
}

.item-icon { font-size: 24px; }
.item-info { flex: 1; overflow: hidden; }
.item-info h4 { margin: 0; font-size: 16px; }
.item-info a { font-size: 12px; color: var(--secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.btn-xs { padding: 4px 10px; font-size: 12px; border: none; cursor: pointer; border-radius: 4px; }
.btn-danger { background: rgba(255, 76, 76, 0.2); color: #ff4c4c; }

.toggle-source {
    display: flex;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 3px;
}

.toggle-source button {
    flex: 1;
    padding: 6px;
    border: none;
    background: transparent;
    color: #888;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
    border-radius: 6px;
    transition: 0.2s;
}

.toggle-source button.active {
    background: var(--primary);
    color: black;
}

.file-input {
    padding: 8px;
    font-size: 12px;
}
</style>
