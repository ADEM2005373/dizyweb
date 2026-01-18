<template>
  <button @click="toggleTheme" class="theme-toggle" :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'">
    <SunIcon v-if="isDark" class="h-6 w-6 text-yellow-400" />
    <MoonIcon v-else class="h-6 w-6 text-slate-700" />
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { SunIcon, MoonIcon } from '@heroicons/vue/24/solid';

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  isDark.value = savedTheme === 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
});
</script>

<style scoped>
.theme-toggle {
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: rotate(15deg) scale(1.1);
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.text-yellow-400 { color: #facc15; }
.text-slate-700 { color: #334155; }

/* In dark mode, moon might need different color if used */
[data-theme="dark"] .text-slate-700 { color:white; }
</style>
