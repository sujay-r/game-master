<template>
  <div class="pill-container" ref="pillContainer">
    <PillBase :color="color" :font-color="fontColor" class="clickable" @click="showCalendar">
      <div class="pill-contents">
        <span v-html="dueDateIcon" class="icon-container"></span>
        <p class="pill-text">{{ displayText }}</p>
        <span v-if="selectedDate" class="deselect-button" @click.self.stop
          @click.self="clearDateSelection">&times;</span>
      </div>
    </PillBase>
    <div v-if="isCalendarShowing" class="date-picker-container" :style="{ width: overlayWidth + 'px' }">
      <VueDatePicker v-model="selectedDate" :auto-apply="true" :use-range="false" :inline="true"
        @update:model-value="selectDate" />
    </div>
  </div>
</template>

<script setup lang="ts">

import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import PillBase from './PillBase.vue';
import { changeSvgColor, changeSvgSize } from '@/utils/svg';
import { fetchTokenIconSvg } from '@/lib/supabase';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  color?: string,
  fontColor?: string,
  date: Date | null,
  fallbackText: string,
}>();

const pillContainer = ref<HTMLElement>();
const overlayWidth = ref<number | undefined>(0);

const selectedDate = ref<Date | null>();
const isCalendarShowing = ref<boolean>(false);

var dueDateIcon = ref<string>();
const displayText = computed(() => {
  return selectedDate.value ? selectedDate.value.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : props.fallbackText;
})

async function showCalendar() {
  isCalendarShowing.value = true;

  await nextTick()
  if (isCalendarShowing.value) {
    positionOverlay();
    document.addEventListener('click', handleClickOutside);
  }
  else {
    document.removeEventListener('click', handleClickOutside);
  }
}

function selectDate(value: any) {
  selectedDate.value = value;
  isCalendarShowing.value = false;

  document.removeEventListener('click', handleClickOutside);
}

function clearDateSelection() {
  selectedDate.value = null;
}

function positionOverlay() {
  const pillRect = pillContainer.value?.getBoundingClientRect();
  overlayWidth.value = pillRect?.width;
}

function handleClickOutside(event: any) {
  if (pillContainer.value && !pillContainer.value.contains(event.target)) {
    isCalendarShowing.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
}

onMounted(async () => {
  overlayWidth.value = pillContainer.value?.getBoundingClientRect().width;

  selectedDate.value = props.date ? props.date : null;

  // TODO: Cache all the icons in a dedicated icon pinia store
  // to avoid making API calls unnecessarily.
  dueDateIcon.value = await fetchTokenIconSvg('due_date.svg');
  dueDateIcon.value = changeSvgColor(dueDateIcon.value, "#424242");
  dueDateIcon.value = changeSvgSize(dueDateIcon.value, 13);
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
})

</script>


<style scoped>
.clickable {
  cursor: pointer;
}

.pill-container {
  position: relative;
  display: inline;
}

.icon-container {
  display: contents;
}

.pill-contents {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 3px;
  padding: 1px;
}

.pill-text {
  display: inline;
  margin: 0;
  padding: 0;

  margin-left: 3px;
  margin-right: 3px;
}

.date-picker-container {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  z-index: 9999;
}

.deselect-button {
  margin-top: 1px;
}
</style>
