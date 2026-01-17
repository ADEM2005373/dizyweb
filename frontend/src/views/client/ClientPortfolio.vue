<template>
  <div class="client-portfolio fade-in">
    <div class="header-split">
      <div>
        <h2>Espace Livrables</h2>
        <p class="subtitle">Retrouvez les maquettes, rapports et fichiers partagés par votre agent.</p>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="filters glass">
      <button :class="['filter-btn', filter === 'all' ? 'active' : '']" @click="filter = 'all'">Tout</button>
      <button :class="['filter-btn', filter === 'image' ? 'active' : '']" @click="filter = 'image'">Images</button>
      <button :class="['filter-btn', filter === 'video' ? 'active' : '']" @click="filter = 'video'">Vidéos</button>
      <button :class="['filter-btn', filter === 'lien' ? 'active' : '']" @click="filter = 'lien'">Liens</button>
      <button :class="['filter-btn', filter === 'fichier' ? 'active' : '']" @click="filter = 'fichier'">Fichiers</button>
    </div>

    <!-- GALLERY GRID -->
    <div class="gallery-wrapper">
      <div v-if="loading" class="loading">Ouverture du coffre-fort numérique...</div>
      
      <div v-else-if="filteredItems.length" class="gallery-grid">
        <div v-for="item in filteredItems" :key="item._id" class="card glass item-card">
          <div class="item-preview">
            <template v-if="item.type === 'image'">
              <img :src="item.url" alt="Livrable" @error="imgFallback">
              <div class="overlay-zoom"><MagnifyingGlassIcon class="h-8 w-8" /></div>
            </template>
            <template v-else-if="item.type === 'video'">
              <video :src="item.url" controls class="video-preview"></video>
            </template>
            <div class="icon-placeholder" v-else>
              <component :is="getIcon(item.type)" class="h-12 w-12 text-muted" />
            </div>
          </div>

          <div class="item-info">
            <div class="info-top">
              <h4>{{ item.description }}</h4>
              <span class="type-tag">{{ item.type }}</span>
            </div>
            <p class="item-date">Ajouté le {{ formatDate(item.date) }}</p>
            <a :href="item.url" target="_blank" class="download-btn">
              <span>Voir l'élément</span>
              <ArrowRightIcon class="h-4 w-4 arrow" />
            </a>
          </div>
        </div>
      </div>

      <div v-else class="empty-state card glass">
        <div class="empty-icon"><FolderOpenIcon class="h-12 w-12" /></div>
        <p>Votre portfolio est vide pour le moment.</p>
        <small>Votre agent ajoutera ici vos livrables au fur et à mesure.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  ArrowRightIcon, 
  FolderOpenIcon,
  LinkIcon,
  DocumentIcon,
  PlayIcon,
  IdentificationIcon
} from '@heroicons/vue/24/outline';

const user = ref({});
const items = ref([]);
const filter = ref('all');
const loading = ref(true);

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
    await fetchPortfolio();
  }
});

const fetchPortfolio = async () => {
  loading.value = true;
  try {
    const userId = user.value.id || user.value._id;
    const token = localStorage.getItem('token');
    const pfRes = await axios.get(`http://localhost:5000/api/portfolios?client=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (pfRes.data && pfRes.data.length > 0) {
      const portfolio = pfRes.data[0];
      const elRes = await axios.get(`http://localhost:5000/api/elementPortfolios?portfolio=${portfolio._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      items.value = elRes.data.sort((a,b) => new Date(b.date) - new Date(a.date));
    }
  } catch (err) {
    console.error("Portfolio fetch error", err);
  } finally {
    loading.value = false;
  }
};

const filteredItems = computed(() => {
  if (filter.value === 'all') return items.value;
  return items.value.filter(i => i.type === filter.value);
});

const getIcon = (type) => {
  if(type === 'lien') return LinkIcon;
  if(type === 'fichier') return DocumentIcon;
  if(type === 'video') return PlayIcon;
  return IdentificationIcon;
};

const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'short', year: 'numeric'
});

const imgFallback = (e) => {
  e.target.src = 'https://via.placeholder.com/400x300?text=Aperçu+Indisponible';
};
</script>

<style scoped>
.header-split { margin-bottom: 40px; }
.filters { display: flex; gap: 10px; padding: 5px; width: fit-content; margin-bottom: 35px; border-radius: 12px; }
.filter-btn { 
  background: transparent; border: none; padding: 8px 20px; border-radius: 8px; 
  color: var(--text-muted); cursor: pointer; transition: 0.3s; font-weight: 600; 
}
.filter-btn.active { background: rgba(0,0,0,0.05); color: var(--text-main); }

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.item-card { 
  padding: 0; overflow: hidden; display: flex; flex-direction: column; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0,0,0,0.05);
}
.item-card:hover { transform: translateY(-8px); border-color: var(--primary); box-shadow: 0 15px 30px rgba(0,0,0,0.15); }

.item-preview {
  height: 180px; position: relative; overflow: hidden; background: #000;
  display: flex; align-items: center; justify-content: center;
}
.item-preview img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.item-card:hover .item-preview img { transform: scale(1.1); filter: brightness(0.6); }

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-zoom {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 24px; opacity: 0; transition: 0.3s;
}
.item-card:hover .overlay-zoom { opacity: 1; }

.icon-placeholder { 
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.02));
}
.type-icon { font-size: 48px; }

.item-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.info-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.info-top h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main); line-height: 1.4; }
.type-tag { font-size: 9px; text-transform: uppercase; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; color: var(--text-muted); }

.item-date { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }

.download-btn {
  margin-top: auto; display: flex; justify-content: space-between; align-items: center;
  text-decoration: none; color: var(--secondary); font-size: 13px; font-weight: 600;
  padding: 10px 15px; background: rgba(0,0,0,0.05); border-radius: 8px; transition: 0.3s;
}
.download-btn:hover { background: var(--secondary); color: black; }
.download-btn .arrow { transition: 0.3s; }
.download-btn:hover .arrow { transform: translateX(5px); }

.empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
.empty-icon { font-size: 50px; margin-bottom: 20px; opacity: 0.5; }
.empty-state small { display: block; margin-top: 10px; font-size: 12px; }
.h-12.w-12{width: 7%;}

.loading { text-align: center; padding: 40px; color: var(--secondary); font-weight: 600; }
</style>

