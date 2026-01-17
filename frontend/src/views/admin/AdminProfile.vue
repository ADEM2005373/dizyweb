<template>
  <div class="profile-container">
    <div class="header-section">
        <h3>Mon Profil Administrateur</h3>
    </div>

    <div class="card glass profile-card">
        <form @submit.prevent="updateProfile">
            <div class="upload-avatar mb-30">
                <div class="avatar-circle">AD</div>
            </div>

            <div class="form-row">
                <div class="form-group half">
                    <label>Prénom</label>
                    <input v-model="form.prenom" class="glass-input">
                </div>
                <div class="form-group half">
                    <label>Nom</label>
                    <input v-model="form.nom" class="glass-input">
                </div>
            </div>

            <div class="form-group">
                <label>Email (pour recevoir les notifications)</label>
                <input v-model="form.email" type="email" class="glass-input">
                <small style="color: var(--text-muted); font-size: 12px;">Mettez à jour votre email pour recevoir les notifications d'inscription de nouveaux clients.</small>
            </div>

            <div class="form-group">
                <label>Nouveau Mot de Passe (laisser vide pour ne pas changer)</label>
                <input v-model="form.password" type="password" placeholder="••••••••" class="glass-input">
            </div>

            <div class="form-actions right">
                <button type="submit" class="btn btn-primary">Mettre à jour le profil</button>
            </div>
        </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminProfile',
  data() {
    return {
      user: null,
      form: {
        nom: '', prenom: '', email: '', password: ''
      }
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.form.nom = this.user.nom;
    this.form.prenom = this.user.prenom;
    this.form.email = this.user.email;
  },
  methods: {
    async updateProfile() {
       try {
         const token = localStorage.getItem('token');
         // We might need a specific endpoint for self-update or use the generic user update
         // Assuming PUT /api/auth/profile or PUT /api/users/:id
         // Let's use users/:id
         
         const payload = {
            nom: this.form.nom,
            prenom: this.form.prenom,
            email: this.form.email
         };
         if(this.form.password) payload.motDePasse = this.form.password;

         const res = await axios.put(`http://localhost:5000/api/users/${this.user._id}`, payload, { // NOTE: Need to ensure this route exists or is secured for admins
            headers: { Authorization: `Bearer ${token}` }
         });

         // Update local storage
         const updatedUser = { ...this.user, ...res.data }; // Merge
         localStorage.setItem('user', JSON.stringify(updatedUser));
         
         alert("Profil mis à jour avec succès");
       } catch (err) {
         console.error(err);
         alert("Erreur lors de la mise à jour");
       }
    }
  }
}
</script>

<style scoped>
.profile-container { max-width: 600px; margin: 0 auto; }
.profile-card { padding: 40px; }

.upload-avatar { display: flex; justify-content: center; }
.avatar-circle {
    width: 100px; height: 100px;
    background: var(--primary);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 700; color: #ffffff;
    border: 4px solid rgba(255,255,255,0.1);
}

.mb-30 { margin-bottom: 30px; }
.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: var(--text-muted); font-size: 13px; }

.glass-input {
    width: 100%; padding: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: rgb(0, 0, 0);
}

.right { display: flex; justify-content: flex-end; }
</style>
