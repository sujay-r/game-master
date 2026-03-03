<template>
  <component :is="headingTag">
    <img :src="img_path" alt="" :class="imgSizeClass" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  img_path: string
  size?: number
}>()

const headingTag = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1
  return `h${s}`
})

const imgSizeClass = computed(() => {
  const s = props.size && props.size >= 1 && props.size <= 6 ? props.size : 1
  return `size-${s}`
})
</script>

<style scoped>
img {
  height: auto;
  width: auto;
  max-width: 100%;
  display: block;
  margin: 0 auto;
}

/* Desktop sizes */
img.size-1 {
  max-height: 350px;
}
img.size-2 {
  max-height: 300px;
}
img.size-3 {
  max-height: 250px;
}
img.size-4 {
  max-height: 200px;
}
img.size-5 {
  max-height: 150px;
}
img.size-6 {
  max-height: 100px;
}

/* Tablet (iPad Mini and smaller) */
@media (max-width: 768px) {
  img.size-1 {
    max-height: 280px;
  }
  img.size-2 {
    max-height: 240px;
  }
  img.size-3 {
    max-height: 200px;
  }
  img.size-4 {
    max-height: 160px;
  }
  img.size-5 {
    max-height: 120px;
  }
  img.size-6 {
    max-height: 80px;
  }
}

/* Large phones (iPhone Plus/Max - 430px) */
@media (max-width: 430px) {
  img {
    margin: 0;
    max-width: 100vw;
  }
  img.size-1 {
    max-height: 140px;
  }
  img.size-2 {
    max-height: 120px;
  }
  img.size-3 {
    max-height: 100px;
  }
  img.size-4 {
    max-height: 80px;
  }
  img.size-5 {
    max-height: 60px;
  }
  img.size-6 {
    max-height: 40px;
  }
}

/* Standard phones (iPhone 16 Pro, 15, 14 - 393px) */
@media (max-width: 395px) {
  img.size-1 {
    max-height: 120px;
  }
  img.size-2 {
    max-height: 100px;
  }
  img.size-3 {
    max-height: 85px;
  }
  img.size-4 {
    max-height: 70px;
  }
  img.size-5 {
    max-height: 50px;
  }
  img.size-6 {
    max-height: 35px;
  }
}

/* Small phones (iPhone SE - 375px) */
@media (max-width: 375px) {
  img.size-1 {
    max-height: 110px;
  }
  img.size-2 {
    max-height: 95px;
  }
  img.size-3 {
    max-height: 80px;
  }
  img.size-4 {
    max-height: 65px;
  }
  img.size-5 {
    max-height: 48px;
  }
  img.size-6 {
    max-height: 32px;
  }
}
</style>
