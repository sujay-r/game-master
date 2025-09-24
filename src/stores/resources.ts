import { defineStore } from "pinia";
import type { StatType } from "@/types/common";


const useStatStore = defineStore("stats", {
  state: () => ({
    stats: [
      {
        statName: "Health", stat: 50, effects: [{ buff: true, text: "Workout" }, {
          buff: false, text:
            "Sick"
        }]
      },
      { statName: "Focus", stat: 90, effects: [] },
      { statName: "Energy", stat: 20, effects: [] },
      { statName: "Mood", stat: 65, effects: [{ buff: false, text: "Shitty CS game" }] },
    ]
  })
})

export { useStatStore }
