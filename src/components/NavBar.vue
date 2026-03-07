<template>
  <!-- Mobile: bottom drawer -->
  <nav class="nav-mobile" :class="{ 'nav-mobile--open': isOpen }" aria-label="Main navigation">
    <!-- Ribbon pull-tab: protrudes above the drawer, horizontally centered -->
    <button
      class="nav-mobile__ribbon"
      @click="toggle"
      :aria-expanded="isOpen"
      aria-label="Toggle navigation"
    >
      <svg
        class="nav-mobile__ribbon-chevron"
        :class="{ 'nav-mobile__ribbon-chevron--open': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>

    <div class="nav-mobile__track">
      <!-- Nav links -->
      <div class="nav-mobile__links">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ 'nav-link--active': currentPath === '/' }"
          aria-label="HUD"
          :aria-current="currentPath === '/' ? 'page' : undefined"
        >
          <span class="nav-link__icon">
            <!-- House icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 21 9 12 15 12 15 21" />
            </svg>
          </span>
          <span class="nav-link__label">HUD</span>
        </RouterLink>

        <RouterLink
          to="/quests"
          class="nav-link"
          :class="{ 'nav-link--active': currentPath === '/quests' }"
          aria-label="Quests"
          :aria-current="currentPath === '/quests' ? 'page' : undefined"
        >
          <span class="nav-link__icon">
            <!-- Sword icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
              <line x1="13" y1="19" x2="19" y2="13" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="19" y1="21" x2="21" y2="19" />
            </svg>
          </span>
          <span class="nav-link__label">Quests</span>
        </RouterLink>
      </div>

      <!-- Logout button - Mobile (right extreme) -->
      <button
        class="nav-link nav-link--logout mobile-logout"
        @click="handleLogout"
        aria-label="Logout"
      >
        <span class="nav-link__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span class="nav-link__label">Logout</span>
      </button>
    </div>
  </nav>

  <!-- Desktop: left rail -->
  <nav class="nav-rail" :class="{ 'nav-rail--open': isOpen }" aria-label="Main navigation">
    <!-- Body: clips the nav links during width transition -->
    <div class="nav-rail__body">
      <div class="nav-rail__links">
        <RouterLink
          to="/"
          class="nav-link"
          :class="{ 'nav-link--active': currentPath === '/' }"
          aria-label="HUD"
          :aria-current="currentPath === '/' ? 'page' : undefined"
        >
          <span class="nav-link__icon">
            <!-- House icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <polyline points="9 21 9 12 15 12 15 21" />
            </svg>
          </span>
          <span class="nav-link__label">HUD</span>
        </RouterLink>

        <RouterLink
          to="/quests"
          class="nav-link"
          :class="{ 'nav-link--active': currentPath === '/quests' }"
          aria-label="Quests"
          :aria-current="currentPath === '/quests' ? 'page' : undefined"
        >
          <span class="nav-link__icon">
            <!-- Sword icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
              <line x1="13" y1="19" x2="19" y2="13" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="19" y1="21" x2="21" y2="19" />
            </svg>
          </span>
          <span class="nav-link__label">Quests</span>
        </RouterLink>
      </div>

      <!-- Logout button - Desktop (bottom of rail) -->
      <button
        class="nav-link nav-link--logout desktop-logout"
        @click="handleLogout"
        aria-label="Logout"
      >
        <span class="nav-link__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <span class="nav-link__label">Logout</span>
      </button>
    </div>

    <!-- Ribbon toggle: protrudes outside the rail at vertical center -->
    <button
      class="nav-rail__ribbon"
      @click="toggle"
      :aria-expanded="isOpen"
      aria-label="Toggle navigation"
    >
      <svg
        class="nav-rail__ribbon-chevron"
        :class="{ 'nav-rail__ribbon-chevron--open': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const STORAGE_KEY = 'nav-open'

// Collapsed heights/widths
const MOBILE_COLLAPSED_H = 40 // px — only ribbon tab visible
const MOBILE_EXPANDED_H = 100 // px — links + toggle tab
const RAIL_COLLAPSED_W = 35 // px
const RAIL_EXPANDED_W = 96 // px

const route = useRoute()
const currentPath = ref(route.path)

watch(
  () => route.path,
  (path) => {
    currentPath.value = path
  },
)

const isOpen = ref(false)

function loadPersistedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      isOpen.value = JSON.parse(stored)
    }
  } catch {
    // ignore
  }
}

function applyRootVars() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (isMobile) {
    const h = isOpen.value ? MOBILE_EXPANDED_H : MOBILE_COLLAPSED_H
    document.documentElement.style.setProperty('--nav-bottom-offset', `${h}px`)
    document.documentElement.style.setProperty('--nav-rail-width', `${RAIL_COLLAPSED_W}px`)
  } else {
    document.documentElement.style.setProperty('--nav-bottom-offset', '0px')
    const w = isOpen.value ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W
    document.documentElement.style.setProperty('--nav-rail-width', `${w}px`)
  }
}

function toggle() {
  isOpen.value = !isOpen.value
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isOpen.value))
  } catch {
    // ignore
  }
  applyRootVars()
}

// Re-apply on resize in case viewport crosses the breakpoint
function handleResize() {
  applyRootVars()
}

onMounted(() => {
  loadPersistedState()
  applyRootVars()
  window.addEventListener('resize', handleResize)
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
/* ─── Shared nav-link styles ──────────────────────────────────────────────── */

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  text-decoration: none;
  color: #929292;
  transition:
    color 0.2s,
    background-color 0.2s;
}

.nav-link:hover {
  color: #424242;
  background-color: rgba(0, 0, 0, 0.04);
}

/* Active: solid green background, white icon + label */
.nav-link--active {
  background-color: #32a287;
  color: #fff;
}

.nav-link--active:hover {
  background-color: #2d826d;
  color: #fff;
}

.nav-link__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-link__label {
  font-family: Perpetua, Avenir, Helvetica, Arial, sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.nav-link--logout {
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
}

/* ─── Mobile bottom drawer ────────────────────────────────────────────────── */

.nav-mobile {
  display: none;
}

@media (max-width: 768px) {
  .nav-mobile {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    overflow: visible;
    /* translate the whole bar down so only the ribbon tab peeks up */
    transform: translateY(calc(100% - 40px));
    transition: transform 0.3s ease;
  }

  .nav-mobile--open {
    transform: translateY(0);
  }

  /* Ribbon pull-tab: protrudes above the drawer, horizontally centered */
  .nav-mobile__ribbon {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);

    /* Ribbon shape: rounded top, flat bottom glued to drawer */
    width: 48px;
    height: 14px;
    border-radius: 8px 8px 0 0;
    padding: 0;

    /* Dark translucent pull-tab look */
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: none;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: background 0.2s;
  }

  .nav-mobile__ribbon:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .nav-mobile__ribbon:focus {
    outline: none;
  }

  .nav-mobile__ribbon-chevron {
    transition: transform 0.3s ease;
    flex-shrink: 0;
    /* default: pointing up → signals "open" when collapsed */
    transform: rotate(0deg);
  }

  .nav-mobile__ribbon-chevron--open {
    /* open: pointing down → signals "close" */
    transform: rotate(180deg);
  }

  .nav-mobile__track {
    background: #eeede8;
    border-top: 1px solid #cfcfcf;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    border-radius: 14px 14px 0 0;
    overflow: hidden;
  }

  /* Links panel: slides off above the track when collapsed so icons don't show */
  .nav-mobile__links {
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 0.75rem 1.5rem 0.75rem;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  }

  .nav-mobile--open .nav-mobile__links {
    transform: translateY(0);
  }

  /* Mobile logout button - positioned at right extreme */
  .nav-mobile .mobile-logout {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: auto;
    padding: 0.5rem;
  }

  .nav-mobile:not(.nav-mobile--open) .mobile-logout {
    display: none;
  }
}

/* ─── Desktop left rail ───────────────────────────────────────────────────── */

.nav-rail {
  display: none;
}

@media (min-width: 769px) {
  /* Rail: overflow visible so the ribbon tab can protrude outside */
  .nav-rail {
    display: block;
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 35px;
    overflow: visible;
    transition: width 0.3s ease;
    z-index: 200;
  }

  .nav-rail--open {
    width: 96px;
  }

  /* Body: clips the nav links as the rail width transitions */
  .nav-rail__body {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #eeede8;
    border-right: 1px solid #cfcfcf;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.06);
  }

  /* Links container: fixed at full expanded width; slides off-screen when collapsed */
  .nav-rail__links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1.5rem 0.25rem 0.5rem;
    width: 96px;
    /* Collapsed: push entirely off-screen to the left so nothing leaks through */
    transform: translateX(-96px);
    transition: transform 0.3s ease;
  }

  .nav-rail--open .nav-rail__links {
    transform: translateX(0);
  }

  .nav-rail .nav-link {
    /* 88% of 96px ≈ 84px — narrows the active highlight pill */
    width: 88%;
    align-self: center;
    flex-direction: column;
    justify-content: center;
  }

  /* Hide label when rail is collapsed */
  .nav-rail:not(.nav-rail--open) .nav-link__label {
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .nav-rail--open .nav-link__label {
    opacity: 1;
    transition: opacity 0.2s ease 0.1s;
  }

  /* Desktop logout button - positioned at bottom of rail */
  .nav-rail .desktop-logout {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 88%;
  }

  .nav-rail:not(.nav-rail--open) .desktop-logout {
    display: none;
  }

  /* ── Ribbon toggle tab ─────────────────────────────────────────────────── */

  .nav-rail__ribbon {
    /* Sit outside the rail's right edge, vertically centered */
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%) translateX(100%);

    /* Ribbon shape: flat left edge, rounded right */
    width: 14px;
    height: 48px;
    border-radius: 0 8px 8px 0;
    padding: 0;

    /* Dark translucent pull-tab look */
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: none;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    transition: background 0.2s;
  }

  .nav-rail__ribbon:hover {
    background: rgba(0, 0, 0, 0.7);
  }

  .nav-rail__ribbon:focus {
    outline: none;
  }

  .nav-rail__ribbon-chevron {
    transition: transform 0.3s ease;
    flex-shrink: 0;
    /* default: pointing right → signals "expand" */
  }

  .nav-rail__ribbon-chevron--open {
    /* open: pointing left → signals "collapse" */
    transform: rotate(180deg);
  }
}
</style>
