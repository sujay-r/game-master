import { defineStore } from "pinia";
import type { StatType } from "@/types/common";
import { fetchStatsWithEffects } from "@/lib/supabase";

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
    }
  }
})

export { useStatStore }
