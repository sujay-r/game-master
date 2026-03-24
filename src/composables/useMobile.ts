import { ref, onMounted, onUnmounted } from 'vue'

export function useMobile() {
  const isMobile = ref(false)

  let mediaQuery: MediaQueryList | null = null

  function handleChange(event: MediaQueryListEvent | MediaQueryList) {
    isMobile.value = 'matches' in event ? event.matches : (event as MediaQueryList).matches
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(max-width: 768px)')
    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)
  })

  onUnmounted(() => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleChange)
    }
  })

  return { isMobile }
}
