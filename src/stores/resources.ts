import { defineStore } from "pinia";
import type { StatType } from "@/types/common";
import { fetchStatsWithEffects, fetchStatValue, fetchIconSvg } from "@/lib/supabase";
import { changeSvgColor, changeSvgSize } from '@/utils/svg';

interface StatStoreState {
  stats: StatType[]
}

interface IconStoreState {
  icons: Record<string, string>
}

const useStatStore = defineStore("stats", {
  state: (): StatStoreState => ({
    stats: []
  }),
  actions: {
    async fetchStatsFromDb() {
      try {
        this.stats = await fetchStatsWithEffects();
      } catch (err) {
        console.error("Error while fetching stats from the database: ", err);
      }
    },
    async fetchStatValueFromDb(statId: number) {
      try {
        const data = await fetchStatValue(statId);

        if (data) {
          const statIndex = this.stats.findIndex(stat => stat.id === statId)
          if (statIndex !== -1) {
            this.stats[statIndex].value = data.value;
          }
        }
      }
      catch (err) {
        console.error("Error while fetching stat from db: ", err);
      }
    }
  }
})

const useIconStore = defineStore("icons", {
  state: (): IconStoreState => ({
    icons: {}
  }),
  actions: {
    async getIcon(filename: string, color: string, size: number) {
      // TODO: Modify the if block to also change the color and size of the svg text.
      if (this.icons[filename]) {
        return this.icons[filename];
      }

      try {
        const svgText = await fetchIconSvg(filename);
        const coloredSvg = changeSvgColor(svgText, color);
        const finalSvg = changeSvgSize(coloredSvg, size);

        this.icons[filename] = finalSvg;
        return finalSvg;
      }
      catch (err) {
        console.error("Error fetching icon " + filename + ": " + err);
        return undefined;
      }
    }
  }
})

export { useStatStore, useIconStore }
