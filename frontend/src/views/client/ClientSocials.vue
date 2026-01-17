<template>
  <div class="socials-container fade-in">
    <div class="header-section">
      <h3>Mes Réseaux Sociaux</h3>
      <p class="subtitle">Accédez rapidement à vos comptes de réseaux sociaux.</p>
    </div>

    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else class="socials-grid">
      <!-- FACEBOOK -->
      <div class="card glass social-card fb">
        <div class="social-header">
          <div class="platform-icon fb-icon">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <span class="platform-name">Facebook</span>
        </div>
        <p class="platform-desc">Page Facebook de votre entreprise</p>
        <a v-if="socialLinks.facebook" :href="socialLinks.facebook" target="_blank" class="btn btn-primary social-btn">
          <ArrowTopRightOnSquareIcon class="h-5 w-5 mr-2" /> Accéder à Facebook
        </a>
        <div v-else class="no-link">
          <ExclamationCircleIcon class="h-5 w-5" />
          <span>Lien non configuré</span>
        </div>
      </div>

      <!-- INSTAGRAM -->
      <div class="card glass social-card ig">
        <div class="social-header">
          <div class="platform-icon ig-icon">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <span class="platform-name">Instagram</span>
        </div>
        <p class="platform-desc">Profil Instagram professionnel</p>
        <a v-if="socialLinks.instagram" :href="socialLinks.instagram" target="_blank" class="btn btn-primary social-btn">
          <ArrowTopRightOnSquareIcon class="h-5 w-5 mr-2" /> Accéder à Instagram
        </a>
        <div v-else class="no-link">
          <ExclamationCircleIcon class="h-5 w-5" />
          <span>Lien non configuré</span>
        </div>
      </div>

      <!-- LINKEDIN -->
      <div class="card glass social-card ln">
        <div class="social-header">
          <div class="platform-icon ln-icon">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
          <span class="platform-name">LinkedIn</span>
        </div>
        <p class="platform-desc">Page LinkedIn entreprise</p>
        <a v-if="socialLinks.linkedin" :href="socialLinks.linkedin" target="_blank" class="btn btn-primary social-btn">
          <ArrowTopRightOnSquareIcon class="h-5 w-5 mr-2" /> Accéder à LinkedIn
        </a>
        <div v-else class="no-link">
          <ExclamationCircleIcon class="h-5 w-5" />
          <span>Lien non configuré</span>
        </div>
      </div>

      <!-- TWITTER/X -->
      <div class="card glass social-card tw">
        <div class="social-header">
          <div class="platform-icon tw-icon">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <span class="platform-name">X (Twitter)</span>
        </div>
        <p class="platform-desc">Compte X professionnel</p>
        <a v-if="socialLinks.twitter" :href="socialLinks.twitter" target="_blank" class="btn btn-primary social-btn">
          <ArrowTopRightOnSquareIcon class="h-5 w-5 mr-2" /> Accéder à X
        </a>
        <div v-else class="no-link">
          <ExclamationCircleIcon class="h-5 w-5" />
          <span>Lien non configuré</span>
        </div>
      </div>

      <!-- WEBSITE -->
      <div class="card glass social-card web">
        <div class="social-header">
          <div class="platform-icon web-icon">
            <GlobeAltIcon class="h-6 w-6" />
          </div>
          <span class="platform-name">Site Web</span>
        </div>
        <p class="platform-desc">Votre site internet</p>
        <a v-if="socialLinks.website" :href="socialLinks.website" target="_blank" class="btn btn-primary social-btn">
          <ArrowTopRightOnSquareIcon class="h-5 w-5 mr-2" /> Visiter le site
        </a>
        <div v-else class="no-link">
          <ExclamationCircleIcon class="h-5 w-5" />
          <span>Lien non configuré</span>
        </div>
      </div>
    </div>

    <!-- INFO CARD -->
    <div class="card glass info-card mt-30">
      <div class="info-content">
        <InformationCircleIcon class="h-6 w-6 text-primary" />
        <div>
          <h4>Besoin de configurer vos liens ?</h4>
          <p>Contactez votre agent pour ajouter ou modifier les liens vers vos réseaux sociaux.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  ArrowTopRightOnSquareIcon, 
  ExclamationCircleIcon,
  GlobeAltIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';

const loading = ref(true);
const socialLinks = ref({
  facebook: '',
  instagram: '',
  linkedin: '',
  twitter: '',
  website: ''
});

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const userId = user.id || user._id;

    // Fetch fresh data from API
    try {
        const token = localStorage.getItem('token');
        const axios = (await import('axios')).default;
        const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.socialLinks) {
            socialLinks.value = res.data.socialLinks;
            // Update local storage to keep it fresh
            user.socialLinks = res.data.socialLinks;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (err) {
        console.error("Error fetching fresh user data", err);
        // Fallback to local storage if API fails
        if (user.socialLinks) {
            socialLinks.value = user.socialLinks;
        }
    }
  }
  loading.value = false;
});
</script>

<style scoped>
.socials-container { padding: 5px; }
.header-section { margin-bottom: 30px; }
.subtitle { color: var(--text-muted); font-size: 14px; }

.socials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.social-card {
  padding: 25px;
  border-top: 4px solid var(--primary);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.social-card.fb { border-top-color: #1877F2; }
.social-card.ig { border-top-color: #E4405F; }
.social-card.ln { border-top-color: #0A66C2; }
.social-card.tw { border-top-color: #000000; }
.social-card.web { border-top-color: var(--primary); }

.social-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.platform-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.fb-icon { background: #1877F2; }
.ig-icon { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
.ln-icon { background: #0A66C2; }
.tw-icon { background: #000000; }
.web-icon { background: var(--primary); }

.platform-name { font-weight: 700; font-size: 18px; color: var(--text-main); }
.platform-desc { font-size: 13px; color: var(--text-muted); margin: 0; }

.social-btn {
  margin-top: auto;
  width: 100%;
  justify-content: center;
}

.no-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.03);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  margin-top: auto;
}
.h-6.w-6.text-primary{
  width :50px;
}

.mt-30 { margin-top: 30px; }

.info-card { padding: 20px; }
.info-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}
.info-content h4 { margin: 0 0 5px; font-size: 15px; }
.info-content p { margin: 0; font-size: 13px; color: var(--text-muted); }
.text-primary { color: var(--primary); }

.loading { text-align: center; padding: 40px; color: var(--text-muted); }
</style>
