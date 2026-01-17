<template>
  <div class="stats-container">
    <!-- KPIS -->
    <div class="grid-4">
      <div class="card glass">
        <div class="stat-content">
          <div class="stat-value">{{ stats.clients }}</div>
          <div class="stat-label">Clients Total</div>
        </div>
        <div class="stat-trend positive">+12%</div>
      </div>
      <div class="card glass">
        <div class="stat-content">
          <div class="stat-value">{{ stats.agents }}</div>
          <div class="stat-label">Agents Actifs</div>
        </div>
        <div class="stat-trend neutral">0%</div>
      </div>
      <div class="card glass">
        <div class="stat-content">
          <div class="stat-value">{{ stats.revenue }}</div>
          <div class="stat-label">Total Factures (€)</div>
        </div>
        <div class="stat-trend positive text-green">Règlements</div>
      </div>
      <div class="card glass">
        <div class="stat-content">
          <div class="stat-value">{{ stats.potentialRevenue }}</div>
          <div class="stat-label">Valeur Devis/Factures (€)</div>
        </div>
        <div class="stat-trend neutral">Approuvé</div>
      </div>
    </div>

    <!-- NOTIFICATIONS / LOGS -->
    <div class="grid-1 mt-30">
        <div class="card glass">
            <h3>Activité Récente (Notifications)</h3>
            <div v-if="notifications.length === 0" class="empty">Aucune activité récente.</div>
            <div class="notif-list">
                <div v-for="notif in notifications" :key="notif._id" class="notif-item">
                    <span class="dot-status"></span>
                    <div class="notif-content">
                        <p class="msg">{{ notif.message }}</p>
                        <span class="date">{{ new Date(notif.date).toLocaleString() }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "AdminStats",
  data() {
    return {
      stats: { 
        clients: 0, 
        agents: 0, 
        revenue: 0,
        potentialRevenue: 0
      },
      notifications: []
    }
  },
  mounted() {
    this.fetchStats();
    this.fetchNotifications();
  },
  methods: {
    async fetchNotifications() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Show recent last
            this.notifications = res.data.reverse().slice(0, 5);
        } catch(err) {
            console.error(err);
        }
    },
    async fetchStats() {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Get Clients Count
            const clientsRes = await axios.get('http://localhost:5000/api/users?role=client', { headers });
            
            // 2. Get Agents Count
            const agentsRes = await axios.get('http://localhost:5000/api/users?role=agent', { headers });

            // 3. Get Revenue (Sum of 'Facture' documents)
            const docsRes = await axios.get('http://localhost:5000/api/documentCommerciaux', { headers });
            
            // Paid invoices only
            const revenue = docsRes.data
                .filter(d => d.typeDocument === 'FACTURE' && d.statutPaiement === 'PAYE') 
                .reduce((sum, d) => sum + (d.montantTTC || 0), 0);

            // All approved invoices (even if not paid yet)
            const potentialRevenue = docsRes.data
                .filter(d => d.typeDocument === 'FACTURE' && d.statut === 'APPROUVE')
                .reduce((sum, d) => sum + (d.montantTTC || 0), 0);

            this.stats = {
                clients: clientsRes.data.length,
                agents: agentsRes.data.length,
                revenue: revenue.toFixed(2),
                potentialRevenue: potentialRevenue.toFixed(2)
            };

        } catch (err) {
            console.error("Error loading stats", err);
        }
    }
  }
}
</script>

<style scoped>
.grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.grid-1 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
}

.mt-30 { margin-top: 30px; }

.card {
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

/* For cards that wrap vertical content like notifications */
.grid-1 .card { flex-direction: column; justify-content: flex-start; }
.card h3 { margin-top: 0; font-size: 18px; margin-bottom: 20px; }

.stat-value { font-size: 32px; font-weight: 700; margin-bottom: 4px; }
.stat-label { color: var(--text-muted); font-size: 13px; text-transform: uppercase; }

.stat-trend {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 20px;
    background: rgba(255,255,255,0.05);
}
.stat-trend.positive { color: #00e676; background: rgba(0, 230, 118, 0.1); }
.stat-trend.neutral { color: var(--text-muted); }

/* NOTIFICATIONS */
.notif-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.notif-item { display: flex; gap: 15px; align-items: flex-start; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; transition: background 0.3s; }
.notif-item:hover { background: rgba(255,255,255,0.05); }

.dot-status { min-width: 10px; height: 10px; border-radius: 50%; background: var(--secondary); margin-top: 6px; box-shadow: 0 0 8px var(--secondary); }

.notif-content { flex: 1; }
.msg { margin: 0 0 5px; font-size: 14px; color: white; }
.date { font-size: 11px; color: var(--text-muted); }

.empty { color: var(--text-muted); font-style: italic; padding: 20px; text-align: center; }
</style>