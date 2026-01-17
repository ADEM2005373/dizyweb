<template>
  <div class="client-calendar fade-in">
    <div class="header-split">
      <div>
        <h2>Mes Rendez-Vous</h2>
        <p class="subtitle">Gérez vos réunions et points d'avancement avec votre conseiller.</p>
      </div>
      <button @click="showModal = true" class="btn btn-primary">
        <PlusIcon class="h-5 w-5 mr-1" /> Réserver un créneau
      </button>
    </div>

    <!-- TABS -->
    <div class="tabs glass">
      <div :class="['tab', { active: activeTab === 'upcoming' }]" @click="activeTab='upcoming'">À venir</div>
      <div :class="['tab', { active: activeTab === 'history' }]" @click="activeTab='history'">Historique</div>
    </div>

    <!-- LIST -->
    <div class="rdv-content">
      <div v-if="loading" class="loading">Chargement de votre agenda...</div>
      
      <div v-else-if="filteredAppointments.length === 0" class="empty-state card glass">
        <p>Aucun rendez-vous pour le moment.</p>
      </div>

      <div v-else class="rdv-list">
        <div v-for="rdv in filteredAppointments" :key="rdv._id" class="card glass rdv-item">
          <div class="date-badge">
            <span class="day">{{ new Date(rdv.dateProposee).getDate() }}</span>
            <span class="month">{{ getMonthName(rdv.dateProposee) }}</span>
            <span class="time">{{ formatTime(rdv.dateProposee) }}</span>
          </div>
          
          <div class="rdv-details">
            <h4>{{ rdv.type }}</h4>
            <p class="agent-info">
              <UserIcon class="h-4 w-4" /> 
              Conseiller: {{ rdv.agent?.prenom || 'Assigné' }} {{ rdv.agent?.nom || '' }}
            </p>
          </div>

          <div class="rdv-status">
            <span :class="['status-pill', getStatusClass(rdv.statut)]">
              {{ rdv.statut }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-overlay fade-in">
      <div class="modal card glass shadow-lg">
        <h3>Demander un Rendez-Vous</h3>
        <p class="modal-sub">Choisissez le type de réunion et la date souhaitée.</p>
        
        <form @submit.prevent="bookMeeting">
            <div class="form-group">
                <label>Type de session</label>
                <select v-model="form.type" class="glass-input" required>
                    <option>Consultation Stratégique</option>
                    <option>Point d'avancement</option>
                    <option>Urgence Technique</option>
                    <option>Démo Produit</option>
                </select>
            </div>

            <div class="form-group">
                <label>Date et Heure</label>
                <input type="datetime-local" v-model="form.dateProposee" class="glass-input" required>
            </div>

            <div class="modal-actions">
                <button type="button" @click="showModal = false" class="btn btn-secondary">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="booking">
                  {{ booking ? 'Envoi...' : 'Confirmer la demande' }}
                </button>
            </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { PlusIcon, UserIcon } from '@heroicons/vue/24/outline';

const user = ref({});
const activeTab = ref('upcoming');
const showModal = ref(false);
const appointments = ref([]);
const loading = ref(true);
const booking = ref(false);

const form = ref({
  type: 'Consultation Stratégique',
  dateProposee: ''
});

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchAppointments();
  }
});

const fetchAppointments = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const userId = user.value.id || user.value._id;
    const res = await axios.get('http://localhost:5000/api/rendezvous', {
      headers: { Authorization: `Bearer ${token}` }
    });
    appointments.value = res.data.filter(rdv => rdv.client?._id === userId || rdv.client === userId)
                                 .sort((a,b) => new Date(a.dateProposee) - new Date(b.dateProposee));
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const filteredAppointments = computed(() => {
  const now = new Date();
  if (activeTab.value === 'upcoming') {
    return appointments.value.filter(a => new Date(a.dateProposee) >= now || a.statut === 'en attente');
  } else {
    return appointments.value.filter(a => new Date(a.dateProposee) < now && a.statut !== 'en attente').reverse();
  }
});

const bookMeeting = async () => {
  booking.value = true;
  try {
    const token = localStorage.getItem('token');
    const userId = user.value.id || user.value._id;
    await axios.post('http://localhost:5000/api/rendezvous', {
        client: userId,
        type: form.value.type,
        dateProposee: form.value.dateProposee
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Votre demande a été transmise à votre conseiller !');
    showModal.value = false;
    await fetchAppointments();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Erreur lors de la réservation');
  } finally {
    booking.value = false;
  }
};

const getMonthName = (date) => new Date(date).toLocaleString('fr-FR', { month: 'short' }).toUpperCase();
const formatTime = (date) => new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const getStatusClass = (status) => {
  const s = status.toLowerCase();
  if(s === 'confirmé') return 'success';
  if(s === 'en attente') return 'warning';
  if(s === 'annulé') return 'danger';
  return 'neutral';
};
</script>

<style scoped>
.header-split { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.tabs { display: flex; gap: 10px; padding: 5px; width: fit-content; margin-bottom: 30px; border-radius: 12px; }
.tab { padding: 10px 25px; cursor: pointer; color: var(--text-muted); border-radius: 8px; font-weight: 600; transition: 0.3s; }
.tab.active { background: rgba(0, 0, 0, 0.05); color: var(--text-main); }

.rdv-list { display: flex; flex-direction: column; gap: 15px; }
.rdv-item { display: flex; align-items: center; padding: 20px; transition: 0.3s; }
.rdv-item:hover { transform: translateX(5px); }

.date-badge {
  display: flex; flex-direction: column; align-items: center; min-width: 90px;
  border-right: 1px solid rgba(0, 0, 0, 0.1); margin-right: 25px; padding-right: 15px;
}
.day { font-size: 28px; font-weight: 800; color: var(--secondary); line-height: 1; }
.month { font-size: 11px; font-weight: 700; color: var(--text-muted); margin: 4px 0; }
.time { font-size: 13px; font-weight: 600; background: rgba(0, 0, 0, 0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-main); }

.rdv-details { flex: 1; }
.rdv-details h4 { margin: 0 0 5px; font-size: 18px; }
.agent-info { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

.status-pill { padding: 6px 15px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.status-pill.success { background: rgba(0, 230, 118, 0.1); color: #00e676; }
.status-pill.warning { background: rgba(255, 193, 7, 0.1); color: #ffc107; }
.status-pill.danger { background: rgba(255, 76, 76, 0.1); color: #ff4c4c; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { width: 100%; max-width: 450px; padding: 35px; border: 1px solid rgba(0, 0, 0, 0.1); background: white; }
.modal-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 25px; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-muted); }
.glass-input { width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text-main); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; }

.empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
.loading { text-align: center; padding: 40px; color: var(--secondary); font-weight: 600; }
</style>

