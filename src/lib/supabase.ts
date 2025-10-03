import type { StatType, StatusEffectType } from "@/types/common";
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY

const client = createClient(supabaseUrl, supabaseApiKey)

async function fetchStatsWithEffects(): Promise<StatType[]> {
  try {
    const { data, error } = await client.from("Stat").select("*, StatusEffect(*)")

    if (error) {
      throw error
    }
    if (!data) {
      return []
    }
    return data.map(item => {
      const { StatusEffect, ...rest } = item
      return {
        ...rest,
        effects: StatusEffect
      }
    })
  } catch (err) {
    console.error("Error fetching stats: ", err)
    throw err
  }
}

async function fetchStatValue(statId: number) {
  try {
    const { data, error } = await client.from('Stat').select('value').eq('id', statId).single();

    if (error) {
      throw error
    }

    return data
  }
  catch (err) {
    console.error("Error while fetching stat value: ", err);
  }
}

async function updateStatValue(statId: number, newValue: number) {
  try {
    const { error } = await client.from('Stat').update({ value: newValue }).eq('id', statId);

    if (error) {
      throw error
    }
  }
  catch (err) {
    console.error("Error while updating stat value: ", err);
  }
}

async function insertStatusEffectInTable(statusEffect: StatusEffectType): Promise<number> {
  try {
    const { data, error } = await client.from("StatusEffect").insert(statusEffect).select()

    if (error) {
      throw error
    }

    return data[0].id
  } catch (err) {
    console.error("Error while inserting status effect in table: ", err)
    throw err
  }
}

async function insertAffectedStatusInTable(affectedStatuses: any) {
  try {
    const { error } = await client.from("AffectedStat").insert(affectedStatuses)
    if (error) {
      throw error
    }
  } catch (err) {
    throw err
  }
}

async function addStatusEffect(statusEffect: StatusEffectType, stats: StatType[]) {
  try {
    const insertedId = await insertStatusEffectInTable(statusEffect)

    const affectedStatuses = stats.map(item => ({
      stat_id: item.id,
      effect_id: insertedId
    }))
    await insertAffectedStatusInTable(affectedStatuses)
  }
  catch (err) {
    console.error("Error while adding status effect: ", err)
  }
}

async function deleteAffectedStatusFromTable(effectId: number) {
  try {
    const response = await client.from("AffectedStat").delete().eq('effect_id', effectId);
  }
  catch (err) {
    throw err
  }
}

async function deleteStatusEffectFromTable(effectId: number) {
  try {
    const response = await client.from("StatusEffect").delete().eq('id', effectId);
  }
  catch (err) {
    throw err
  }
}

async function deleteStatusEffect(effectId: number) {
  try {
    await deleteAffectedStatusFromTable(effectId);
    await deleteStatusEffectFromTable(effectId);
  }
  catch (err) {
    console.error("Error while deleting status effect: ", err);
  }
}


export { client, fetchStatsWithEffects, fetchStatValue, addStatusEffect, deleteStatusEffect, updateStatValue }
