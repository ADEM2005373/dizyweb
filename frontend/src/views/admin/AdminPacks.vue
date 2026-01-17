<template>
  <div class="packs-manager">
    <div class="header-actions">
      <h3>Gestion des Packs et Services</h3>
      <div class="actions-group">
          <button v-if="packs.length === 0 && !loading" @click="seedDefaultPacks" class="btn btn-secondary">
            Initialiser Défauts
          </button>
           <button v-if="packs.length > 0" @click="deleteAllPacks" class="btn btn-danger-soft">
            🗑️ Tout Supprimer
          </button>
          <button v-if="!showForm" @click="openForm()" class="btn btn-primary">
            + Nouveau Pack
          </button>
      </div>
    </div>

    <!-- PACK FORM (Toggleable) -->
    <div v-if="showForm" class="form-card glass fade-in">
      <h4>{{ isEdit ? 'Modifier le Pack' : 'Créer un nouveau Pack' }}</h4>
      <form @submit.prevent="savePack">
        <div class="form-row">
          <div class="form-group half">
            <label>Titre du Pack</label>
            <input v-model="form.titre" placeholder="ex: Starter" required class="glass-input">
          </div>
          <div class="form-group half">
            <label>Type</label>
            <select v-model="form.type" class="glass-input">
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Description (séparez les avantages par des virgules)</label>
          <textarea v-model="form.description" rows="3" placeholder="Avantage 1, Avantage 2..." class="glass-input"></textarea>
        </div>

        <div class="form-row">
            <div class="form-group third">
                <label>Prix TTC (DT)</label>
                <input v-model="form.prix" type="number" step="0.01" @input="calcHT" required class="glass-input">
            </div>
            <div class="form-group third">
                <label>Prix HT (DT)</label>
                <input v-model="form.prixHT" type="number" step="0.01" @input="calcTTC" required class="glass-input">
            </div>
            <div class="form-group third">
                <label>TVA (%)</label>
                <input v-model="form.tva" type="number" @input="calcTTC" required class="glass-input">
            </div>
        </div>
        <div class="form-group">
            <label>Image URL (Optionnel)</label>
            <input v-model="form.image" placeholder="https://..." class="glass-input">
        </div>

        <div class="form-actions">
          <button type="button" @click="closeForm" class="btn btn-secondary">Annuler</button>
          <button type="submit" class="btn btn-primary">{{ isEdit ? 'Mettre à jour' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <!-- PACKS LIST -->
    <div class="packs-grid" v-if="!loading">
      <div v-for="pack in packs" :key="pack._id" class="card glass pack-card">
        <div class="pack-header">
            <div class="pack-icon">{{ pack.titre.charAt(0) }}</div>
            <div class="pack-status" :class="{ active: pack.actif }"></div>
        </div>
        <h4>{{ pack.titre }}</h4>
        <p class="pack-price">{{ pack.prix }} DT TTC</p>
        <p class="pack-price-small">{{ pack.prixHT }} DT HT ({{ pack.tva }}%)</p>
        <p class="pack-desc">{{ truncate(pack.description, 60) }}</p>
        
        <div class="pack-actions">
           <button @click="editPack(pack)" class="btn-xs btn-primary">Editer</button>
           <button @click="deletePack(pack._id)" class="btn-xs btn-danger">Supprimer</button>
        </div>
      </div>
    </div>
    <div v-else class="loading">Chargement...</div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminPacks',
  data() {
    return {
      packs: [],
      loading: false,
      showForm: false,
      isEdit: false,
      editId: null,
      form: {
        titre: '',
        description: '',
        type: 'Standard',
        prix: 0,
        image: '',
        actif: true
      }
    }
  },
  mounted() {
    this.fetchPacks();
    // Auto-refresh every 5s to sync with changes if needed, or just once is fine.
  },
  methods: {
    async fetchPacks() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/packs', {
             headers: { Authorization: `Bearer ${token}` }
        });
        // Admin sees ALL packs, active or not
        this.packs = res.data;
        console.log("AdminPacks loaded:", this.packs.length, "items");
        // Remove this alert after debugging
        // alert(`DEBUG: Admin loaded ${this.packs.length} packs.`); 
      } catch (err) {
        console.error("Error fetching packs", err);
        // alert("DEBUG Error: Check Console");
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
      this.resetForm();
    },
    resetForm() {
      this.isEdit = false;
      this.editId = null;
      this.form = { titre: '', description: '', type: 'Standard', prix: 0, prixHT: 0, tva: 20, image: '', actif: true };
    },
    calcTTC() {
        this.form.prix = (this.form.prixHT * (1 + this.form.tva / 100)).toFixed(2);
    },
    calcHT() {
        this.form.prixHT = (this.form.prix / (1 + this.form.tva / 100)).toFixed(2);
    },
    editPack(pack) {
      this.form = { ...pack };
      this.editId = pack._id;
      this.isEdit = true;
      this.showForm = true;
    },
    async savePack() {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        try {
            if (this.isEdit) {
                await axios.put(`http://localhost:5000/api/packs/${this.editId}`, this.form, { headers });
            } else {
                await axios.post('http://localhost:5000/api/packs', this.form, { headers });
            }
            this.closeForm();
            this.fetchPacks();
        } catch (err) {
            alert('Erreur lors de la sauvegarde');
            console.error(err);
        }
    },
    async deletePack(id) {
        if(!confirm("Êtes-vous sûr ?")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/packs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            this.fetchPacks();
        } catch (err) {
            console.error(err);
        }
    },
    async seedDefaultPacks() {
        if(!confirm("Ajouter les packs par défaut (Starter, Business, Premium) ?")) return;
        const defaults = [
            { titre: "Starter", description: "Idéal pour débuter votre présence en ligne.", type: "Standard", prix: 499, actif: true },
            { titre: "Business", description: "Pour les entreprises en croissance.", type: "Premium", prix: 999, actif: true },
            { titre: "Premium", description: "Solution complète et sur-mesure.", type: "Premium", prix: 1999, actif: true }
        ];
        
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            for(const pack of defaults) {
                 await axios.post('http://localhost:5000/api/packs', pack, { headers });
            }
            alert("Packs ajoutés !");
            this.fetchPacks();
        } catch(err) {
            console.error(err);
            alert("Erreur lors de l'initialisation");
        }
    },
    async deleteAllPacks() {
        if(!confirm("⚠️ DANGER: Supprimer TOUS les packs ? Cette action est irréversible.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/packs', { headers: { Authorization: `Bearer ${token}` } });
            
            for(const pack of res.data) {
                 await axios.delete(`http://localhost:5000/api/packs/${pack._id}`, {
                     headers: { Authorization: `Bearer ${token}` }
                 });
            }
            alert("Tous les packs ont été supprimés.");
            this.fetchPacks();
        } catch(err) {
            console.error(err);
            alert("Erreur lors de la suppression totale.");
        }
    },
    truncate(text, length) {
        if(!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
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

.actions-group {
    display: flex;
    gap: 10px;
}

.packs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
}

.pack-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.2s;
}

.pack-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary);
}

.pack-icon {
    width: 50px;
    height: 50px;
    background: var(--bg-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
    border: 1px solid var(--border);
}

.pack-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4c4c;
    position: absolute;
    top: 20px;
    right: 20px;
}
.pack-status.active { background: #00e676; }

.pack-price {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    margin: 5px 0 2px 0;
}
.pack-price-small {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.pack-desc {
    font-size: 13px;
    color: var(--text-muted);
    flex-grow: 1;
    margin-bottom: 15px;
}

.pack-actions {
    display: flex;
    gap: 10px;
    width: 100%;
}

.btn-xs {
    flex: 1;
    padding: 8px;
    font-size: 12px;
    border: none;
    cursor: pointer;
    border-radius: 4px;
}
.btn-primary { background: var(--primary); color: rgb(247, 236, 236); }
.btn-secondary { background: rgba(255,255,255,0.1); color: rgb(24, 23, 23); }
.btn-danger { background: rgba(255, 76, 76, 0.2); color: #ff4c4c; }
.btn-danger-soft { background: rgba(255, 76, 76, 0.1); color: #ff6b6b; border: 1px solid rgba(255,76,76,0.2); }
.btn-danger-soft:hover { background: rgba(255, 76, 76, 0.2); }

/* FORM STYLES */
.form-card {
    padding: 30px;
    margin-bottom: 30px;
    max-width: 600px;
    border-left: 4px solid var(--primary);
}

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.third { flex: 1; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-size: 13px; color: var(--text-muted); }

.glass-input {
  width: 100%;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: rgb(14, 14, 14);
}
</style>
