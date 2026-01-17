<template>
  <div class="auth-wrapper">
    <div class="glow-circle top"></div>
    <div class="glow-circle bottom"></div>

    <div class="auth-card glass fade-in">
      <div class="auth-header">
        <h2>Rejoindre <span class="text-primary">DIZY</span></h2>
        <p>Commencez votre transformation digitale</p>
      </div>

      <form @submit.prevent="register" class="auth-form">
        <div class="row">
          <div class="form-group half">
            <label>Nom</label>
            <input v-model="form.nom" placeholder="Doe" required class="glass-input" />
          </div>
          <div class="form-group half">
            <label>Prénom</label>
            <input v-model="form.prenom" placeholder="John" required class="glass-input" />
          </div>
        </div>

        <div class="form-group">
          <label>Entreprise</label>
          <input v-model="form.entreprise" placeholder="Ma Société SARL" required class="glass-input" />
        </div>

        <div class="form-group">
          <label>Secteur d'activité</label>
          <input v-model="form.secteur" placeholder="Marketing, Tech, Vente..." required class="glass-input" />
        </div>

        <div class="form-group">
          <label>Matricule Fiscale</label>
          <input v-model="form.matriculeFiscale" placeholder="123456789" required class="glass-input" />
        </div>

        <div class="form-group">
          <label>Adresse Complète</label>
          <input v-model="form.adresse" placeholder="12 Rue example" class="glass-input" required />
        </div>

        <div class="row">
          <div class="form-group half">
            <label>Code Postal</label>
            <input v-model="form.codePostal" placeholder="75000" class="glass-input" required />
          </div>
          <div class="form-group half">
             <label>Ville</label>
             <input v-model="form.ville" placeholder="Paris" class="glass-input" required />
          </div>
        </div>

        <div class="form-group">
          <label>Téléphone</label>
          <input v-model="form.telephone" placeholder="+33 6 12 34 56 78" class="glass-input" required />
        </div>

        <div class="form-group">
          <label>Email Professionnel</label>
          <input v-model="form.email" type="email" placeholder="john@example.com" required class="glass-input" />
        </div>

        <div class="form-group">
          <label>Mot de passe</label>
          <input v-model="form.motDePasse" type="password" placeholder="••••••••" required class="glass-input" />
        </div>

        <button type="submit" class="btn btn-primary full-width" :disabled="loading">
          <span v-if="!loading">Créer mon compte</span>
          <span v-else>Traitement...</span>
        </button>

        <p v-if="successMessage" class="success-msg fade-in">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error-msg fade-in">{{ errorMessage }}</p>
      </form>

      <div class="auth-footer">
        <p>Déjà client ? <router-link to="/login" class="text-primary">Se connecter</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const form = ref({
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '',
  entreprise: '',
  secteur: '',
  matriculeFiscale: '',
  adresse: '',
  codePostal: '',
  ville: '',
  telephone: ''
});

const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const register = async () => {
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    await axios.post('http://localhost:5000/api/auth/register', form.value);
    successMessage.value = 'Compte créé avec succès ! Connectez-vous maintenant.';
    // Clear form
    form.value = { nom: '', prenom: '', email: '', motDePasse: '', entreprise: '', secteur: '', matriculeFiscale: '', adresse: '', codePostal: '', ville: '', telephone: '' };
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Erreur lors de l\'inscription.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-dark);
}

.auth-card {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  border: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 10;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-header h2 {
  font-size: 24px;
}

.auth-header p {
  color: var(--text-muted);
  font-size: 14px;
}

.text-primary {
  color: var(--primary);
  font-weight: 600;
}

.row {
  display: flex;
  gap: 15px;
}

.half {
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  color: var(--text-muted);
}

.glass-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: rgb(0, 0, 0);
  transition: all 0.3s;
}

.glass-input:focus {
  border-color: var(--primary);
  background: rgba(255,255,255,0.05);
  outline: none;
}

.full-width {
  width: 100%;
  margin-top: 10px;
}

.auth-footer {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
}

.success-msg {
  color: #00e676;
  font-size: 13px;
  margin-top: 15px;
  text-align: center;
  background: rgba(0, 230, 118, 0.1);
  padding: 10px;
  border-radius: var(--radius-sm);
}

.error-msg {
  color: #ff4c4c;
  font-size: 13px;
  margin-top: 15px;
  text-align: center;
  background: rgba(255, 76, 76, 0.1);
  padding: 10px;
  border-radius: var(--radius-sm);
}

/* Background Glows */
.glow-circle {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.top {
  background: var(--primary);
  top: -100px;
  right: -100px;
}

.bottom {
  background: var(--secondary);
  bottom: -100px;
  left: -100px;
}
</style>
