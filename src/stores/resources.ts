import { defineStore } from "pinia";
import type { StatType } from "@/types/common";
import { fetchStatsWithEffects, fetchStatValue } from "@/lib/supabase";

interface StatStoreState {
  stats: StatType[]
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

export { useStatStore }
