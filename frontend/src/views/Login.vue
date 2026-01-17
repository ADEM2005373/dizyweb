<template>
  <div class="auth-wrapper">
    <!-- Background Elements -->
    <div class="glow-circle top"></div>
    <div class="glow-circle bottom"></div>

    <div class="auth-card glass fade-in">
      <div class="auth-header">
        <img src="../assets/logo.jpg" alt="DIZY Logo" class="auth-logo">
        <h2><span class="text-primary">{{ roleTitle }}</span></h2>
        <p>{{ pageSubtitle }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Email Professionnel</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="nom@entreprise.com" 
            required 
            class="glass-input"
          />
        </div>

        <div class="form-group">
          <label>Mot de passe</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            class="glass-input"
          />
        </div>

        <div class="form-actions">
          <a href="#" class="forgot-pass">Mot de passe oublié ?</a>
        </div>

        <button type="submit" class="btn btn-primary full-width" :disabled="loading">
          <span v-if="!loading">Se connecter</span>
          <span v-else>Connexion en cours...</span>
        </button>

        <p v-if="error" class="error-msg fade-in">{{ error }}</p>
      </form>

      <div class="auth-footer">
        <p>Pas encore de compte ? <router-link to="/register" class="text-primary">Demander un accès</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';
// Note: We'll implement a proper store later, for now direct axios + local storage for speed
// import { useAuthStore } from '../stores/auth.store'; 

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);
const router = useRouter();
const route = useRoute();

const roleTitle = computed(() => {
   const r = route.query.role;
   if(r === 'admin') return 'Administration';
   if(r === 'agent') return 'Espace Agent';
   return 'Espace Client';
});

const pageSubtitle = computed(() => {
    const r = route.query.role;
    if(r === 'admin') return 'Accès sécurisé pour la gestion système';
    if(r === 'agent') return 'Gérez vos clients et votre agenda';
    return 'Connectez-vous à votre espace privilégié';
});

const handleLogin = async () => {
  loading.value = true;
  error.value = null;

  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: email.value,
      motDePasse: password.value
    });

    const { token, user } = res.data;
    
    // Strict Role Validation Logic
    const requestedRole = route.query.role;
    if (requestedRole && user.role !== requestedRole) {
       // If role doesn't match the requested one (e.g. Admin trying to login on Client page)
       // We can either block or redirect. User requested "secure" / "not pass".
       // Let's block with a clear error
       error.value = ` Accès refusé : Ce compte n'est pas un compte ${requestedRole === 'admin' ? 'Administrateur' : requestedRole === 'agent' ? 'Agent' : 'Client'}.`;
       loading.value = false;
       return;
    }

    // Store Auth Data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Redirect based on Role
    if (user.role === 'client') router.push('/client/dashboard');
    else if (user.role === 'agent') router.push('/agent/dashboard');
    else if (user.role === 'admin') router.push('/admin/dashboard');

  } catch (err) {
    console.error(err);
    error.value = err.response?.data?.message || "Erreur de connexion. Vérifiez vos identifiants.";
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
  max-width: 450px;
  padding: 40px;
  position: relative;
  z-index: 10;
  border: 1px solid rgba(255,255,255,0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-logo {
  width: 120px;
  margin-bottom: 20px;
  border-radius: 12px;
}

.auth-header h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.auth-header p {
  color: var(--text-muted);
  font-size: 14px;
}

.text-primary {
  color: var(--primary);
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-muted);
}

.glass-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: rgb(0, 0, 0);
  font-family: var(--font-body);
  transition: all 0.3s ease;
}

.glass-input:focus {
  border-color: var(--primary);
  background: rgba(255,255,255,0.05);
  outline: none;
  box-shadow: 0 0 0 4px rgba(108, 93, 211, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 25px;
}

.forgot-pass {
  font-size: 12px;
  color: var(--text-muted);
}

.forgot-pass:hover {
  color: white;
}

.full-width {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
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
  left: -100px;
}

.bottom {
  background: var(--secondary);
  bottom: -100px;
  right: -100px;
}
</style>
