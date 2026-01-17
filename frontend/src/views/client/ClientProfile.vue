<template>
  <div class="client-profile fade-in">
    <div class="header-split">
      <h2>Mon Profil</h2>
      <p class="subtitle">Gérez vos informations personnelles et de facturation.</p>
    </div>

    <div class="layout-grid">
      <!-- INFO CARD -->
      <div class="card glass info-card">
        <div class="avatar-section">
          <div class="large-avatar">{{ user.prenom?.charAt(0) }}</div>
          <div class="badge admin" v-if="user.role === 'admin'">Administrateur</div>
          <div class="badge client" v-else>Compte Client</div>
        </div>

        <!-- ASSIGNED AGENT INFO -->
        <div v-if="user.agentPrincipal" class="agent-info-card">
          <h4>Votre Agent Assigné</h4>
          <div class="agent-details">
            <div class="agent-avatar">{{ user.agentPrincipal.prenom?.charAt(0) }}</div>
            <div class="agent-info">
              <p class="agent-name">{{ user.agentPrincipal.prenom }} {{ user.agentPrincipal.nom }}</p>
              <p class="agent-specialty">{{ user.agentPrincipal.specialite || 'Spécialiste' }}</p>
              <p class="agent-email">{{ user.agentPrincipal.email }}</p>
            </div>
          </div>
        </div>

        <!-- SOCIAL LINKS -->
        <div v-if="user.socialLinks && (user.socialLinks.facebook || user.socialLinks.instagram || user.socialLinks.linkedin || user.socialLinks.twitter || user.socialLinks.website)" class="social-links-card">
            <h4>Vos Réseaux Sociaux (Gérés par votre agent)</h4>
            <div class="social-icons">
                <a v-if="user.socialLinks.facebook" :href="user.socialLinks.facebook" target="_blank" class="social-icon facebook" title="Facebook">FB</a>
                <a v-if="user.socialLinks.instagram" :href="user.socialLinks.instagram" target="_blank" class="social-icon instagram" title="Instagram">IG</a>
                <a v-if="user.socialLinks.linkedin" :href="user.socialLinks.linkedin" target="_blank" class="social-icon linkedin" title="LinkedIn">IN</a>
                <a v-if="user.socialLinks.twitter" :href="user.socialLinks.twitter" target="_blank" class="social-icon twitter" title="Twitter">X</a>
                <a v-if="user.socialLinks.website" :href="user.socialLinks.website" target="_blank" class="social-icon website" title="Site Web">🌐</a>
            </div>
        </div>

        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-row">
            <div class="form-group half">
              <label>Prénom</label>
              <input v-model="form.prenom" class="glass-input" required />
            </div>
            <div class="form-group half">
              <label>Nom</label>
              <input v-model="form.nom" class="glass-input" required />
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" class="glass-input" readonly />
            <small class="hint">L'email ne peut pas être modifié.</small>
          </div>

          <div class="form-group">
            <label>Entreprise</label>
            <input v-model="form.entreprise" class="glass-input" />
          </div>

          <div class="form-group">
            <label>Secteur d'activité</label>
            <input v-model="form.secteur" class="glass-input" />
          </div>

          <div class="form-group">
            <label>Matricule Fiscale</label>
            <input v-model="form.matriculeFiscale" class="glass-input" readonly />
            <small class="hint">Le matricule fiscale ne peut pas être modifié.</small>
          </div>

          <button type="submit" class="btn btn-primary full-width" :disabled="loading">
            {{ loading ? 'Enregistrement...' : 'Mettre à jour le profil' }}
          </button>
        </form>
      </div>

      <!-- SECURITY CARD -->
      <div class="card glass security-card">
        <h3>Sécurité</h3>
        <p class="subtitle">Modifiez votre mot de passe pour sécuriser votre compte.</p>
        
        <form @submit.prevent="updatePassword" class="password-form">
          <div class="form-group">
            <label>Ancien mot de passe</label>
            <input type="password" v-model="pass.old" class="glass-input" />
          </div>
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" v-model="pass.new" class="glass-input" />
          </div>
          <button type="submit" class="btn btn-secondary full-width">
            Changer le mot de passe
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const user = ref({});
const loading = ref(false);
const form = ref({
  nom: '', prenom: '', entreprise: '', secteur: '', matriculeFiscale: ''
});
const pass = ref({ old: '', new: '' });

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    await fetchUserProfile(parsedUser.id || parsedUser._id);
  }
});

const fetchUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    user.value = res.data;
    form.value = {
      nom: user.value.nom,
      prenom: user.value.prenom,
      email: user.value.email,
      entreprise: user.value.entreprise,
      secteur: user.value.secteur,
      matriculeFiscale: user.value.matriculeFiscale
    };

    // Update localStorage with fresh data
    localStorage.setItem('user', JSON.stringify(user.value));
  } catch (err) {
    console.error('Error fetching user profile:', err);
    // Fallback to localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.value = JSON.parse(storedUser);
      form.value = {
        nom: user.value.nom,
        prenom: user.value.prenom,
        email: user.value.email,
        entreprise: user.value.entreprise,
        secteur: user.value.secteur,
        matriculeFiscale: user.value.matriculeFiscale
      };
    }
  }
};

const updateProfile = async () => {
  loading.value = true;
  try {
    const userId = user.value.id || user.value._id;
    const res = await axios.put(`http://localhost:5000/api/users/${userId}`, form.value);
    
    // Update local storage
    const newUser = { ...user.value, ...res.data };
    localStorage.setItem('user', JSON.stringify(newUser));
    user.value = newUser;
    
    alert("Profil mis à jour !");
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la mise à jour");
  } finally {
    loading.value = false;
  }
};

const updatePassword = () => {
  // Placeholder logic
  alert("Cette fonctionnalité sera bientôt disponible !");
};
</script>

<style scoped>
.header-split { margin-bottom: 40px; }
.layout-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; align-items: start; }

.info-card { padding: 40px; }
.security-card { padding: 30px; }

.avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 30px; }
.large-avatar { width: 100px; height: 100px; background: var(--primary); border-radius: 30px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; margin-bottom: 15px; box-shadow: 0 10px 30px rgba(108, 93, 211, 0.3); }

.badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.badge.client { background: rgba(0, 230, 118, 0.1); color: #00e676; }

.agent-info-card { background: rgba(108, 93, 211, 0.1); border: 1px solid rgba(108, 93, 211, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px; }
.agent-info-card h4 { margin: 0 0 15px 0; color: var(--primary); font-size: 16px; }
.agent-details { display: flex; align-items: center; gap: 15px; }
.agent-avatar { width: 50px; height: 50px; background: var(--primary); border-radius: 25px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: white; }
.agent-info p { margin: 0; }
.agent-name { font-weight: 600; font-size: 16px; }
.agent-specialty { color: var(--text-muted); font-size: 14px; }
.agent-email { color: var(--text-muted); font-size: 13px; }

.social-links-card { background: rgba(255, 255, 255, 0.05); border: 1px dashed var(--border); border-radius: 12px; padding: 20px; margin-bottom: 30px; }
.social-links-card h4 { margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; }
.social-icons { display: flex; gap: 15px; }
.social-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; font-weight: 700; transition: transform 0.2s, background 0.2s; }
.social-icon:hover { transform: translateY(-3px); background: var(--primary); }
.social-icon.facebook:hover { background: #1877F2; }
.social-icon.instagram:hover { background: #E1306C; }
.social-icon.linkedin:hover { background: #0077B5; }
.social-icon.twitter:hover { background: #1DA1F2; }

.profile-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group label { display: block; margin-bottom: 8px; font-size: 13px; color: var(--text-muted); }
.glass-input { width: 100%; padding: 12px; background: rgba(0,0,0,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); }
.hint { font-size: 11px; color: var(--text-muted); margin-top: 5px; display: block; }

h3 { font-size: 20px; margin-bottom: 10px; }
.password-form { margin-top: 25px; display: flex; flex-direction: column; gap: 15px; }
</style>
