<template>
  <div class="landing-wrapper">

    <!-- NAVBAR -->
    <nav class="navbar glass">
      <div class="container nav-container">
        <div class="nav-left">
          <img src="../assets/logo.jpg" alt="DIZY" class="nav-logo">
        </div>

        <ul class="nav-desktop">
          <li><a href="#home">Accueil</a></li>
          <li><a href="#about">À propos</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#packs">Packs</a></li>
        </ul>

        <div class="nav-right">
          <div class="login-wrapper">
            <button class="btn btn-primary" @click.stop="showLogin = !showLogin">
              Accès Portail ▾
            </button>
            <transition name="fade">
                <div class="login-dropdown glass" v-if="showLogin" v-click-outside="() => showLogin = false">
                  <div class="dropdown-group">
                    <span class="group-title">Espace Client</span>
                    <router-link to="/login?role=client" class="dd-item" @click="showLogin = false">Connexion</router-link>
                    <router-link to="/register" class="dd-item highlight" @click="showLogin = false">M'inscrire</router-link>
                  </div>
                  <div class="divider"></div>
                  <router-link to="/login?role=agent" class="dd-item" @click="showLogin = false">🔴 Accès Collaborateur</router-link>
                  <router-link to="/login?role=admin" class="dd-item" @click="showLogin = false">🔵 Portail Admin</router-link>
                </div>
            </transition>
          </div>
        </div>
      </div>
    </nav>

    <!-- HERO SECTION -->
    <section id="home" class="hero-section">
      <div class="container hero-container">
        <div class="hero-content fade-in">
          <span class="hero-badge">Expertise Marketing Digital</span>
          <h1>
            Propulsez votre <br />
            <span class="text-gradient">Ambition.</span>
          </h1>
          <p>
            DIZY accompagne les entreprises dans leur transformation digitale avec des stratégies innovantes, 
            des outils de pointe et un accompagnement de chaque instant.
          </p>
          <div class="hero-buttons">
            <a href="#packs" class="btn btn-primary">Voir nos solutions</a>
            <a href="#contact" class="btn btn-secondary">Demander un audit</a>
          </div>
        </div>
        
        <div class="hero-visual fade-in">
          <div class="logo-hero-wrapper">
             <img src="../assets/logo.jpg" alt="DIZY Logo Large" class="hero-main-logo">
             <div class="glow-wrap"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ABOUT SECTION -->
    <section id="about" class="section-padding">
      <div class="container">
        <div class="section-header">
          <h2>L'Excellence <span class="text-highlight">DIZY</span></h2>
          <p>Partenaire de votre succès dans l'écosystème digital.</p>
        </div>

        <div class="grid-3">
          <div class="card glass feature-card">
            <div class="icon-box">🚀</div>
            <h3>Stratégie 360°</h3>
            <p>Une vision globale pour maximiser votre impact sur tous les canaux.</p>
          </div>
          <div class="card glass feature-card">
            <div class="icon-box">🎯</div>
            <h3>Ciblage Précis</h3>
            <p>Atteignez votre audience idéale avec des campagnes ultra-optimisées.</p>
          </div>
          <div class="card glass feature-card">
            <div class="icon-box">📈</div>
            <h3>ROI Garanti</h3>
            <p>Des résultats mesurables et une croissance soutenue de votre chiffre d'affaires.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PACKS SECTION -->
    <section id="packs" class="section-padding bg-alt">
      <div class="container">
        <div class="section-header">
          <h2>Nos Offres Digitales</h2>
          <p>Des solutions packagées pour une transparence totale.</p>
        </div>

        <div class="grid-3">
          <div 
            class="card glass pack-card" 
            v-for="pack in packs" 
            :key="pack._id"
          >
            <div class="pack-header">
              <span class="pack-tag">Pack Officiel</span>
              <h3>{{ pack.titre }}</h3>
              <div class="price">{{ pack.prix }} <span class="currency">€/mois</span></div>
            </div>
            <p class="pack-desc">{{ pack.description }}</p>
            <button class="btn btn-primary full-width">Choisir ce pack</button>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-brand">
          <img src="../assets/logo.jpg" alt="DIZY" class="footer-logo">
          <p>Digital Easy - L'agence qui simplifie votre croissance.</p>
        </div>
        <div class="footer-links">
          <p>© {{ year }} DIZY. Proudly crafted for growth.</p>
          <router-link to="/login" class="link-muted">Connexion Interne</router-link>
        </div>
      </div>
    </footer>

  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LandingPage",
  directives: {
    'click-outside': {
      mounted(el, binding) {
        el.clickOutsideEvent = (event) => {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value();
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  },
  data() {
    return {
      packs: [],
      year: new Date().getFullYear(),
      showLogin: false
    };
  },
  mounted() {
    this.fetchPacks();
  },
  methods: {
    async fetchPacks() {
      try {
        const res = await axios.get("http://localhost:5000/api/packs");
        // Only show active packs
        this.packs = res.data.filter(p => p.actif);
      } catch (error) {
        console.error("Erreur chargement packs", error);
        this.packs = []; 
      }
    }
  }
};
</script>

<style scoped>
/* NAV */
.navbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1280px;
  height: 70px;
  z-index: 1000;
  border-radius: 100px;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.nav-logo {
  height: 45px;
  border-radius: 8px;
}

.nav-desktop {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-desktop a {
  font-weight: 500;
  color: var(--text-main);
}

.nav-desktop a:hover {
  color: var(--primary);
}

.login-wrapper {
  position: relative;
}

.login-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 240px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: white !important;
  border: 1px solid var(--border);
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  margin-top: 15px;
}

.dropdown-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.group-title {
    font-size: 10px;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 5px;
    padding-left: 10px;
}

.dd-item {
  padding: 10px;
  border-radius: var(--radius-sm);
  display: block;
  text-decoration: none;
  font-size: 14px;
  color: var(--text-main);
  transition: background 0.2s;
}

.dd-item:hover {
  background: var(--bg-glass);
  color: var(--primary);
}

.dd-item.highlight {
    background: var(--primary);
    color: white;
    text-align: center;
    margin-top: 5px;
}
.dd-item.highlight:hover { background: var(--primary-hover); }

.divider {
    height: 1px;
    background: var(--border);
    margin: 5px 0;
}

/* HERO */
.hero-section {
  min-height: 100vh;
  padding-top: 100px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at top right, rgba(217, 20, 20, 0.05), transparent 40%);
}

.hero-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 4rem;
  align-items: center;
}

.hero-badge {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(217, 20, 20, 0.1);
    color: var(--primary);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
}

.hero-content h1 {
  font-size: 4.5rem;
  line-height: 1;
  margin-bottom: 1.5rem;
  color: #1a0505;
}

.text-gradient {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* VISUALS */
.logo-hero-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.hero-main-logo {
    width: 100%;
    max-width: 380px;
    border-radius: 30px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.1);
    z-index: 2;
    animation: float 6s ease-in-out infinite;
}

.glow-wrap {
    position: absolute;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
    opacity: 0.15;
    filter: blur(50px);
    z-index: 1;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

/* GRID */
.section-padding {
  padding: 120px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 5rem;
}

.section-header h2 {
  font-size: 3rem;
  color: #1a0505;
}

.text-highlight {
  color: var(--primary);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}

/* CARDS */
.feature-card {
  padding: 3rem 2rem;
  text-align: center;
}

.icon-box {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
}

.pack-card {
  padding: 4rem 3rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.pack-tag {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 10px;
    font-weight: 700;
    color: var(--primary);
    opacity: 0.5;
    text-transform: uppercase;
}

.pack-header {
  margin-bottom: 2rem;
  width: 100%;
}

.price {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--primary);
  margin-top: 0.5rem;
}

.currency {
  font-size: 1.2rem;
  color: var(--text-muted);
}

.pack-desc {
    margin-bottom: 2rem;
    color: #4a4a4a;
}

.full-width {
  width: 100%;
  margin-top: auto;
}

/* FOOTER */
.footer {
  background: #fdfdfd;
  border-top: 1px solid var(--border);
  padding: 5rem 0;
  margin-top: 5rem;
}

.footer-logo {
    height: 50px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

@keyframes pulse {
  0% { opacity: 0.3; transform: scale(1) translateY(-50%); }
  100% { opacity: 0.5; transform: scale(1.1) translateY(-50%); }
}

@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .navbar {
    width: 100%;
    border-radius: 0;
    top: 0;
  }
}

.link-muted {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  margin-left: 20px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.link-muted:hover {
  opacity: 1;
  color: var(--primary);
}
</style>
