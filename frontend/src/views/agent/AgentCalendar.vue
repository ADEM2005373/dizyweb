<template>
  <div class="calendar-view">
    <div class="header-split">
      <div>
        <h2>Mon Agenda</h2>
        <p class="subtitle">Gérez votre emploi du temps et vos disponibilités.</p>
      </div>
      <div class="availability-box glass">
        <label>Mes Disponibilités (affiché aux clients)</label>
        <div class="input-group">
            <input v-model="availability" placeholder="Ex: Lundi - Vendredi, 9h - 17h" class="glass-input">
            <button @click="updateavailability" class="btn btn-sm btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- CALENDAR GRID -->
    <div class="calendar-container glass">
        <div class="calendar-header">
            <button @click="weekOffset--" class="nav-btn">‹ Préc</button>
            <h3>Semaine du {{ weekDates.start }} au {{ weekDates.end }}</h3>
            <button @click="weekOffset++" class="nav-btn">Suiv ›</button>
        </div>

        <div class="week-grid">
            <div class="time-col">
                <div class="header-cell"></div>
                <div v-for="hour in hours" :key="hour" class="time-cell">{{ hour }}:00</div>
            </div>
            
            <div v-for="(day, index) in days" :key="index" class="day-col">
                <div class="header-cell">
                    <span class="day-name">{{ day.name }}</span>
                    <span class="day-date">{{ day.dateStr }}</span>
                </div>
                <div class="day-track">
                    <!-- Events -->
                    <div v-for="rdv in getEventsForDay(day.fullDate)" 
                         :key="rdv._id" 
                         class="event-chip"
                         :style="getEventStyle(rdv.dateProposee)"
                         @click="viewRdv(rdv)">
                         <span class="ev-time">{{ getEventTime(rdv.dateProposee) }}</span>
                         <span class="ev-title">{{ rdv.client?.entreprise || 'Client' }}</span>
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
  name: "AgentCalendar",
  data() {
    return {
      user: null,
      availability: "",
      weekOffset: 0,
      hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      daysNames: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
      appointments: []
    }
  },
  computed: {
    weekDates() {
        const start = this.getStartDate();
        const end = new Date(start);
        end.setDate(end.getDate() + 4);
        return {
            start: start.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }),
            end: end.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
        }
    },
    days() {
        const start = this.getStartDate();
        return this.daysNames.map((name, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return {
                name,
                dateStr: d.toLocaleDateString('fr-FR', { day: 'numeric' }),
                fullDate: d.toDateString()
            }
        });
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'));
    if(this.user) {
        this.availability = this.user.disponibilites || "";
        this.fetchAppointments();
    }
  },
  methods: {
    getStartDate() {
        const d = new Date();
        const day = d.getDay(); 
        const diff = d.getDate() - day + (day == 0 ? -6:1) + (this.weekOffset * 7); 
        return new Date(d.setDate(diff));
    },
    async fetchAppointments() {
       try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/rendezvous', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const myId = this.user._id;
        // confirmed only
        this.appointments = res.data.filter(r => 
            (r.agent?._id === myId || r.agent === myId) && 
            r.statut === 'confirmé'
        );
       } catch(err){ console.error(err); }
    },
    async updateavailability() {
        try {
            const token = localStorage.getItem('token');
            // Update Agent availability via User update
            await axios.put(`http://localhost:5000/api/users/${this.user._id}`, {
                disponibilites: this.availability
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local user
            this.user.disponibilites = this.availability;
            localStorage.setItem('user', JSON.stringify(this.user));
            alert("Disponibilités mises à jour !");
        } catch(err) {
            console.error(err);
            alert("Erreur");
        }
    },
    getEventsForDay(dateString) {
        return this.appointments.filter(r => new Date(r.dateProposee).toDateString() === dateString);
    },
    getEventStyle(dateStr) {
        const d = new Date(dateStr);
        const hour = d.getHours();
        // Assuming 8am start
        const startHour = 8;
        const top = (hour - startHour) * 60; // 60px per hour
        return {
            top: `${top}px`,
            height: '50px' // fixed 1h height
        }
    },
    getEventTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' });
    },
    viewRdv(rdv) {
        alert(`${rdv.type} avec ${rdv.client?.entreprise}`);
    }
  }
}
</script>

<style scoped>
.header-split {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30px;
}

.availability-box label { display: block; margin-bottom: 5px; font-size: 12px; color: var(--text-muted); }
.input-group { display: flex; gap: 10px; }
.glass-input { background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 8px; border-radius: 4px; color: white; width: 300px; }

.calendar-container {
    padding: 20px;
    min-height: 600px;
}

.calendar-header {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
}

.nav-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: white;
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
}

.week-grid {
    display: flex;
    flex-direction: row;
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    border: 1px solid var(--border);
    overflow: hidden;
}

.time-col {
    width: 60px;
    border-right: 1px solid var(--border);
    flex-shrink: 0;
}

.day-col {
    flex: 1;
    border-right: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
}

.header-cell {
    padding: 10px;
    text-align: center;
    border-bottom: 1px solid var(--border);
    font-weight: 600;
}
.header-cell span { display: block; }
.day-date { font-size: 11px; color: var(--text-muted); }

.time-col { border-right: 1px solid var(--border); margin-top: 45px; /* Adjusted for header height */ }
.time-cell { height: 60px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: var(--text-muted); padding: 5px; text-align: right; box-sizing: border-box; }

.day-col { border-right: 1px solid rgba(255,255,255,0.05); position: relative; }
.day-col:last-child { border: none; }

.day-track {
    position: relative;
    height: 660px; /* 11 hours * 60px */
    background-image: linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 100% 60px; /* Grid lines matching hours */
}

.event-chip {
    position: absolute;
    left: 5px; right: 5px;
    background: rgba(108, 93, 211, 0.9);
    border-radius: 4px;
    padding: 5px;
    font-size: 11px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--secondary);
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    transition: transform 0.2s;
    z-index: 10;
}
.event-chip:hover { transform: scale(1.05); z-index: 100; }
.ev-title { font-weight: 700; display: block; }

.btn-sm { font-size: 12px; padding: 0 15px; }
</style>