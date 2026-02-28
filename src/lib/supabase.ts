import {
  QuestStatus,
  QuestType,
  TaskStatus,
  type Quest,
  type StatType,
  type StatusEffectType,
  type TaskType,
  type TaskOutcomeType,
} from '@/types/common'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY

const client = createClient(supabaseUrl, supabaseApiKey)

async function fetchStatsWithEffects(): Promise<StatType[]> {
  try {
    const { data, error } = await client.from('Stat').select('*, StatusEffect(*)')

    if (error) {
      throw error
    }
    if (!data) {
      return []
    }
    return data.map((item) => {
      const { StatusEffect, ...rest } = item
      return {
        ...rest,
        effects: StatusEffect,
      }
    })
  } catch (err) {
    console.error('Error fetching stats: ', err)
    throw err
  }
}

async function fetchStatValue(statId: number) {
  try {
    const { data, error } = await client.from('Stat').select('value').eq('id', statId).single()

    if (error) {
      throw error
    }

    return data
  } catch (err) {
    console.error('Error while fetching stat value: ', err)
  }
}

async function updateStatValue(statId: number, newValue: number) {
  try {
    const { error } = await client.from('Stat').update({ value: newValue }).eq('id', statId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error while updating stat value: ', err)
  }
}

async function insertStatusEffectInTable(statusEffect: StatusEffectType): Promise<number> {
  try {
    const { data, error } = await client.from('StatusEffect').insert(statusEffect).select()

    if (error) {
      throw error
    }

    return data[0].id
  } catch (err) {
    console.error('Error while inserting status effect in table: ', err)
    throw err
  }
}

async function insertAffectedStatusInTable(affectedStatuses: any) {
  try {
    const { error } = await client.from('AffectedStat').insert(affectedStatuses)
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

    const affectedStatuses = stats.map((item) => ({
      stat_id: item.id,
      effect_id: insertedId,
    }))
    await insertAffectedStatusInTable(affectedStatuses)
  } catch (err) {
    console.error('Error while adding status effect: ', err)
  }
}

async function deleteAffectedStatusFromTable(effectId: number) {
  try {
    const response = await client.from('AffectedStat').delete().eq('effect_id', effectId)
  } catch (err) {
    throw err
  }
}

async function deleteStatusEffectFromTable(effectId: number) {
  try {
    const response = await client.from('StatusEffect').delete().eq('id', effectId)
  } catch (err) {
    throw err
  }
}

async function deleteStatusEffect(effectId: number) {
  try {
    await deleteAffectedStatusFromTable(effectId)
    await deleteStatusEffectFromTable(effectId)
  } catch (err) {
    console.error('Error while deleting status effect: ', err)
  }
}

async function fetchIconSvg(iconName: string): Promise<string> {
  const { data, error } = await client.storage.from('icons').download(iconName)
  if (error) {
    throw error
  }

  return await data.text()
}

async function fetchTokens(tokens: string[]) {
  const { data, error } = await client.from('Token').select('*').in('token_type', tokens)
  if (error) {
    throw error
  }

  return data
}

async function fetchAllTokens() {
  const { data, error } = await client.from('Token').select('*')
  if (error) {
    throw error
  }

  return data
}

async function updateTokenField(tokenType: string, fieldName: string, newValue: any) {
  const { error } = await client
    .from('Token')
    .update({ [fieldName]: newValue })
    .eq('token_type', tokenType)
  if (error) {
    throw error
  }
}

async function deleteOutcomesForTask(taskId: number) {
  const { error } = await client.from('TaskOutcome').delete().eq('task_id', taskId)
  if (error) {
    throw error
  }
}

async function fetchTasksWithOutcomes() {
  const { data, error } = await client.from('Task').select('*, TaskOutcome(*)')
  if (error) {
    throw error
  }

  const results = await Promise.all(
    data.map(async (item) => {
      const { TaskOutcome, ...rest } = item
      const tokenTypes = TaskOutcome.map((outcome: { token_type: string }) => outcome.token_type)
      const tokens = await fetchTokens(tokenTypes)

      return {
        title: item.title,
        description: item.description,
        status: item.status,
        notes: item.notes,
        id: item.id,
        questId: item.quest_id,
        createdAt: new Date(item.created_at),
        dueDate: item.due_date ? new Date(item.due_date) : null,
        outcomes: TaskOutcome.map((outcome: { token_type: string; quantity: number }) => {
          const token = tokens.find((t) => t.token_type === outcome.token_type)

          return {
            token_type: outcome.token_type,
            quantity: outcome.quantity,
            icon_filename: token.icon_filename,
            icon_color: token.icon_color,
          }
        }),
      }
    }),
  )

  return results
}

async function fetchTaskWithOutcomes(taskId: number) {
  const { data, error } = await client.from('Task').select('*, TaskOutcome(*)').eq('id', taskId)
  if (error) {
    throw error
  }

  const results = await Promise.all(
    data.map(async (item) => {
      const { TaskOutcome, ...rest } = item
      const tokenTypes = TaskOutcome.map((outcome: { token_type: string }) => outcome.token_type)
      const tokens = await fetchTokens(tokenTypes)

      return {
        title: item.title,
        description: item.description,
        status: item.status,
        notes: item.notes,
        id: item.id,
        questId: item.quest_id,
        createdAt: new Date(item.created_at),
        dueDate: item.due_date ? new Date(item.due_date) : null,
        outcomes: TaskOutcome.map((outcome: { token_type: string; quantity: number }) => {
          const token = tokens.find((t) => t.token_type === outcome.token_type)

          return {
            token_type: outcome.token_type,
            quantity: outcome.quantity,
            icon_filename: token.icon_filename,
            icon_color: token.icon_color,
          }
        }),
      }
    }),
  )

  return results[0]
}

async function updateTaskField(taskId: number, fieldName: string, newValue: any) {
  const { error } = await client
    .from('Task')
    .update({ [fieldName]: newValue })
    .eq('id', taskId)
  if (error) {
    throw error
  }
}

async function updateTaskTitle(taskId: number, newTitle: string) {
  try {
    await updateTaskField(taskId, 'title', newTitle)
  } catch (err) {
    console.error(err)
  }
}

async function updateTaskDueDate(taskId: number, newDate: string) {
  try {
    await updateTaskField(taskId, 'due_date', newDate)
  } catch (err) {
    console.error(err)
  }
}

async function updateTaskNotes(taskId: number, newNotes: string) {
  try {
    await updateTaskField(taskId, 'notes', newNotes)
  } catch (err) {
    console.error(err)
  }
}

async function updateTaskDescription(taskId: number, newDescription: string) {
  try {
    await updateTaskField(taskId, 'description', newDescription)
  } catch (err) {
    console.error(err)
  }
}

async function updateTaskStatus(taskId: number, newStatus: TaskStatus) {
  try {
    await updateTaskField(taskId, 'status', newStatus)
  } catch (err) {
    console.error(err)
  }
}

async function markTaskDone(task: TaskType) {
  try {
    if (task.id) {
      await updateTaskStatus(task.id, TaskStatus.Done)
      const outcomes = task.outcomes
      const tokenTypes = outcomes?.map((outcome) => outcome.token_type)

      if (tokenTypes) {
        const tokens = await fetchTokens(tokenTypes)

        tokens.forEach(async (token, index) => {
          const outcome = outcomes?.find((o) => o.token_type === token.token_type)
          await updateTokenField(token.token_type, 'quantity', token.quantity + outcome?.quantity)
        })

        await deleteOutcomesForTask(task.id)
      }
    } else {
      throw new Error('No task ID found for task: ' + task.title)
    }
  } catch (err) {
    console.error(err)
  }
}

async function fetchQuests(): Promise<Quest[]> {
  try {
    const { data, error } = await client
      .from('Quest')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!data) {
      return []
    }

    const quests = await Promise.all(
      data.map(async (item) => {
        const { data: tasksData } = await client.from('Task').select('id').eq('quest_id', item.id)

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          notes: item.notes,
          type: item.type as QuestType,
          status: item.status as QuestStatus,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          taskIds: tasksData?.map((t) => t.id) || [],
        }
      }),
    )

    return quests
  } catch (err) {
    console.error('Error fetching quests: ', err)
    throw err
  }
}

async function createQuest(questData: {
  title: string
  description?: string
  notes?: string
  type: QuestType
}): Promise<Quest> {
  try {
    const now = new Date().toISOString()
    const { data, error } = await client
      .from('Quest')
      .insert({
        title: questData.title,
        description: questData.description || null,
        notes: questData.notes || null,
        type: questData.type,
        status: QuestStatus.Todo,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      notes: data.notes,
      type: data.type as QuestType,
      status: data.status as QuestStatus,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      taskIds: [],
    }
  } catch (err) {
    console.error('Error creating quest: ', err)
    throw err
  }
}

async function updateQuest(
  questId: number,
  updates: {
    title?: string
    description?: string
    notes?: string
    type?: QuestType
    status?: QuestStatus
  },
): Promise<void> {
  try {
    const { error } = await client
      .from('Quest')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error updating quest: ', err)
    throw err
  }
}

async function deleteQuest(questId: number, cascadeTasks: boolean): Promise<void> {
  try {
    if (cascadeTasks) {
      const { data: tasks } = await client.from('Task').select('id').eq('quest_id', questId)
      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map((t) => t.id)
        await client.from('TaskOutcome').delete().in('task_id', taskIds)
        await client.from('Task').delete().eq('quest_id', questId)
      }
    } else {
      await client.from('Task').update({ quest_id: null }).eq('quest_id', questId)
    }

    const { error } = await client.from('Quest').delete().eq('id', questId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting quest: ', err)
    throw err
  }
}

async function completeQuest(questId: number): Promise<void> {
  try {
    await updateQuest(questId, { status: QuestStatus.Completed })
  } catch (err) {
    console.error('Error completing quest: ', err)
    throw err
  }
}

async function updateQuestDescription(questId: number, newDescription: string): Promise<void> {
  try {
    await updateQuest(questId, { description: newDescription })
  } catch (err) {
    console.error('Error updating quest description: ', err)
    throw err
  }
}

async function assignTaskToQuest(taskId: number, questId: number): Promise<void> {
  try {
    const { error } = await client.from('Task').update({ quest_id: questId }).eq('id', taskId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error assigning task to quest: ', err)
    throw err
  }
}

async function removeTaskFromQuest(taskId: number): Promise<void> {
  try {
    const { error } = await client.from('Task').update({ quest_id: null }).eq('id', taskId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error removing task from quest: ', err)
    throw err
  }
}

async function insertTaskOutcomes(taskId: number, outcomes: TaskOutcomeType[]): Promise<void> {
  if (outcomes.length === 0) return

  try {
    // Extract only primitive values to avoid Proxy serialization issues
    const outcomesData = outcomes.map((outcome) => {
      const token_type = outcome.token_type
      const quantity = parseInt(outcome.quantity as unknown as string, 10) || 1
      return {
        task_id: taskId,
        token_type: token_type,
        quantity: quantity,
      }
    })

    const { error } = await client.from('TaskOutcome').insert(outcomesData)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error inserting task outcomes: ', err)
    throw err
  }
}

async function insertTask(taskData: {
  title: string
  description: string
  notes: string
  status: TaskStatus
  dueDate: Date | null
  questId?: number
  outcomes?: TaskOutcomeType[]
}): Promise<TaskType> {
  try {
    const { data, error } = await client
      .from('Task')
      .insert({
        title: taskData.title,
        description: taskData.description,
        notes: taskData.notes,
        status: taskData.status,
        due_date: taskData.dueDate?.toISOString() || null,
        quest_id: taskData.questId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Insert outcomes if provided
    if (taskData.outcomes && taskData.outcomes.length > 0) {
      await insertTaskOutcomes(data.id, taskData.outcomes)
    }

    return {
      title: data.title,
      description: data.description,
      status: data.status as TaskStatus,
      notes: data.notes,
      id: data.id,
      questId: data.quest_id,
      createdAt: new Date(data.created_at),
      dueDate: data.due_date ? new Date(data.due_date) : null,
      outcomes: taskData.outcomes || [],
    }
  } catch (err) {
    console.error('Error inserting task: ', err)
    throw err
  }
}

export {
  client,
  fetchStatsWithEffects,
  fetchStatValue,
  addStatusEffect,
  deleteStatusEffect,
  updateStatValue,
  fetchIconSvg,
  fetchAllTokens,
  fetchTasksWithOutcomes,
  fetchTaskWithOutcomes,
  updateTaskTitle,
  updateTaskDueDate,
  updateTaskNotes,
  updateTaskDescription,
  updateTaskStatus,
  markTaskDone,
  fetchQuests,
  createQuest,
  updateQuest,
  deleteQuest,
  completeQuest,
  updateQuestDescription,
  assignTaskToQuest,
  removeTaskFromQuest,
  insertTask,
  insertTaskOutcomes,
}
