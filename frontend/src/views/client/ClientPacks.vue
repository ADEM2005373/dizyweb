<template>
  <div class="client-packs fade-in">
    <div class="header-split">
      <div>
        <h2>Nos Solutions Digitales</h2>
        <p class="subtitle">Des packs sur-mesure pour booster votre croissance.</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Exploration des meilleures offres...</div>

    <div v-else class="packs-grid">
      <div v-for="pack in packs" :key="pack._id" class="card glass pack-card">
        <div class="pack-badge" v-if="pack.recommande">Recommandé</div>
        <div class="pack-content">
          <div class="icon-box"><BriefcaseIcon class="h-8 w-8" /></div>
          <h3>{{ pack.titre }}</h3>
          <div class="price-box">
            <span class="currency">€</span>
            <span class="amount">{{ pack.prix }}</span>
            <span class="period">/projet</span>
          </div>
          <p class="description">{{ pack.description }}</p>
          
          <ul class="features">
            <li v-for="f in pack.avantages" :key="f"><CheckIcon class="h-4 w-4 inline mr-1 text-primary" /><br> {{ f }}</li>
            <li v-if="!pack.avantages?.length"><CheckIcon class="h-4 w-4 inline mr-1 text-primary" /> <br> Support Priority</li>
            <li v-if="!pack.avantages?.length"><CheckCircleIcon class="h-4 w-4 inline mr-1 text-primary" /><br> Expert Consultation</li>
          </ul>
        </div>
        
        <button @click="requestPack(pack)" class="btn btn-primary full-width mt-auto">
          Commander ce pack
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { CheckIcon, CheckCircleIcon, BriefcaseIcon } from '@heroicons/vue/24/outline';

const packs = ref([]);
const loading = ref(true);

onMounted(async () => {
  await fetchPacks();
});

const fetchPacks = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:5000/api/packs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    packs.value = res.data.filter(p => p.actif);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const requestPack = async (pack) => {
  if (confirm(`Commander le pack "${pack.titre}" ?`)) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      // Create a formal document request (DEVIS) for the pack
      await axios.post('http://localhost:5000/api/documentCommerciaux', {
        clientId: user.id || user._id,
        agentId: user.agentPrincipal,
        typeDocument: 'DEVIS',
        montantTTC: pack.prix,
        commentaire: `COMMANDE PACK: ${pack.titre}`,
        statut: 'EN_ATTENTE'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Votre commande a été envoyée ! Votre agent va l'étudier et vous reviendra avec un devis détaillé.");
    } catch (e) {
      console.error(e);
      alert("Erreur envoi demande.");
    }
  }
};
</script>

<style scoped>
.header-split { margin-bottom: 40px; }
.packs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }

.pack-card { 
  padding: 40px 30px; text-align: center; display: flex; flex-direction: column; transition: 0.3s;
  position: relative; overflow: hidden;
  border-radius: 20px;
  width: 300px;
}
.pack-card:hover { transform: translateY(-10px); border-color: var(--primary); }

.pack-badge {
  position: absolute; top: 15px; right: -30px; background: var(--secondary); color: black; font-size: 10px;
  font-weight: 800; padding: 5px 40px; transform: rotate(45deg); text-transform: uppercase;
}

.icon-box { 
  width: 70px; height: 70px; margin: 0 auto 20px; background: rgba(108, 93, 211, 0.1);
  color: var(--primary); font-size: 32px; font-weight: 800; border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
}

.price-box { margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 5px; }
.currency { font-size: 18px; color: var(--text-muted); align-self: flex-start; margin-top: 5px; }
.amount { font-size: 42px; font-weight: 800; }
.period { font-size: 14px; color: var(--text-muted); align-self: flex-end; margin-bottom: 10px; }

.description { font-size: 14px; color: var(--text-muted); margin-bottom: 25px; line-height: 1.6; }

.features { list-style: none; padding: 0; margin: 0 0 30px 0; text-align: left; }
.features li { font-size: 13px; margin-bottom: 10px; color: var(--text-muted); }

.mt-auto { margin-top: auto; }
.loading { text-align: center; padding: 40px; font-weight: 600; color: var(--secondary); }
.h-4.w-4.inline.mr-1.text-primary{
  width: 30px;
  align-items: center;
}
</style>
