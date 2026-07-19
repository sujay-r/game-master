import {
  QuestStatus,
  QuestType,
  TaskStatus,
  RewardStatus,
  TransactionKind,
  TransactionSource,
  BudgetPeriod,
  type Quest,
  type StatType,
  type StatusEffectType,
  type TaskType,
  type TaskOutcomeType,
  type Reward,
  type RewardCost,
  type Tag,
  type TransactionType,
  type Transaction,
  type Budget,
  type UserQuery,
} from '@/types/common'
import {
  isTransactionKind,
  isTransactionSource,
  isBudgetPeriod,
  isDateRangeContext,
  type CreateTransactionTypeInput,
  type CreateTransactionInput,
  type CreateBudgetInput,
  type CreateUserQueryInput,
  type DateRangeContext,
} from '@/types/finance'
import { assertExpenseType } from '@/utils/finance'
import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL
const supabaseApiKey = import.meta.env.VITE_SUPABASE_API_KEY

const client = createClient(supabaseUrl, supabaseApiKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Auth functions
async function signInWithOtp(email: string) {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })
  if (error) {
    throw error
  }
}

async function verifyOtp(email: string, token: string) {
  const { data, error } = await client.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  if (error) {
    throw error
  }
  return data
}

async function signOut() {
  const { error } = await client.auth.signOut()
  if (error) {
    throw error
  }
}

async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await client.auth.getSession()
  return session
}

function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  client.auth.onAuthStateChange(callback)
}

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

  if (!data || data.length === 0) {
    return []
  }

  // Collect all unique token types across all tasks to avoid N+1 queries
  const tokenTypeSet = new Set<string>()
  for (const item of data) {
    for (const outcome of item.TaskOutcome as { token_type: string }[]) {
      tokenTypeSet.add(outcome.token_type)
    }
  }
  const allTokenTypes = Array.from(tokenTypeSet)

  // Single Token query for all outcomes
  const tokens = allTokenTypes.length > 0 ? await fetchTokens(allTokenTypes) : []

  // Batch fetch tags for all tasks
  const taskIds = data.map((item) => item.id as number)
  const tagsMap = await fetchTagsForTasks(taskIds)

  return data.map((item) => {
    const TaskOutcome = item.TaskOutcome as { token_type: string; quantity: number }[]
    return {
      title: item.title,
      description: item.description,
      status: item.status,
      notes: item.notes,
      id: item.id,
      questId: item.quest_id,
      createdAt: new Date(item.created_at),
      dueDate: item.due_date ? new Date(item.due_date) : null,
      completedAt: item.completed_at ? new Date(item.completed_at) : null,
      outcomes: TaskOutcome.map((outcome) => {
        const token = tokens.find((t) => t.token_type === outcome.token_type)
        return {
          token_type: outcome.token_type,
          quantity: outcome.quantity as unknown as string,
          icon_filename: token?.icon_filename as unknown as string,
          icon_color: token?.icon_color as unknown as string,
        }
      }),
      tags: tagsMap.get(item.id as number) || [],
    }
  })
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
        completedAt: item.completed_at ? new Date(item.completed_at) : null,
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

async function updateTaskDueDate(taskId: number, newDate: string | null) {
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

async function updateTaskOutcomes(taskId: number, outcomes: TaskOutcomeType[]): Promise<void> {
  try {
    // Delete existing outcomes
    await deleteOutcomesForTask(taskId)

    // Insert new outcomes if any
    if (outcomes.length > 0) {
      await insertTaskOutcomes(taskId, outcomes)
    }
  } catch (err) {
    console.error('Error updating task outcomes:', err)
    throw err
  }
}

// TODO: Verify if this function is obsolete and delete if unneeded.
async function updateTaskStatus(taskId: number, newStatus: TaskStatus) {
  try {
    await updateTaskField(taskId, 'status', newStatus)
  } catch (err) {
    console.error(err)
  }
}

async function markTaskDone(task: TaskType) {
  try {
    if (typeof task.id === 'number') {
      const { error } = await client
        .from('Task')
        .update({
          status: TaskStatus.Done,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
      if (error) {
        throw error
      }

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
    } else if (!task.id) {
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
      .select('*, Task(id)')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (!data) {
      return []
    }

    // Batch fetch tags for all quests
    const questIds = data.map((item) => item.id as number)
    const tagsMap = await fetchTagsForQuests(questIds)

    return data.map((item) => {
      const tasksData = item.Task as { id: number }[] | null
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
        tags: tagsMap.get(item.id as number) || [],
      }
    })
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
  tagIds?: number[]
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

    // Insert tags if provided
    if (questData.tagIds && questData.tagIds.length > 0) {
      await setTagsForQuest(data.id, questData.tagIds)
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
      tags: [],
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
  tagIds?: number[]
}): Promise<TaskType> {
  try {
    const now = new Date().toISOString()
    const isDone = taskData.status === TaskStatus.Done
    const { data, error } = await client
      .from('Task')
      .insert({
        title: taskData.title,
        description: taskData.description,
        notes: taskData.notes,
        status: taskData.status,
        due_date: taskData.dueDate?.toISOString() || null,
        quest_id: taskData.questId || null,
        created_at: now,
        completed_at: isDone ? now : null,
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

    // Insert tags if provided
    if (taskData.tagIds && taskData.tagIds.length > 0) {
      await setTagsForTask(data.id, taskData.tagIds)
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
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      outcomes: taskData.outcomes || [],
      tags: [],
    }
  } catch (err) {
    console.error('Error inserting task: ', err)
    throw err
  }
}

async function deleteTask(taskId: number): Promise<void> {
  try {
    // Delete outcomes first (cascade)
    await deleteOutcomesForTask(taskId)

    // Then delete the task
    const { error } = await client.from('Task').delete().eq('id', taskId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting task: ', err)
    throw err
  }
}

// Reward functions
async function fetchRewardsWithCosts(status?: RewardStatus): Promise<Reward[]> {
  try {
    let query = client.from('Reward').select('*')
    if (status) {
      query = query.eq('status', status)
    }
    const { data: rewardsData, error: rewardsError } = await query.order('created_at', {
      ascending: false,
    })

    if (rewardsError) {
      throw rewardsError
    }

    if (!rewardsData || rewardsData.length === 0) {
      return []
    }

    // Fetch costs for all rewards
    const rewardIds = rewardsData.map((r) => r.id)
    const { data: costsData, error: costsError } = await client
      .from('RewardCost')
      .select('*')
      .in('reward_id', rewardIds)

    if (costsError) {
      throw costsError
    }

    // Fetch token info for icons
    const tokenTypes = [...new Set(costsData?.map((c) => c.token_type) || [])]
    const tokens = tokenTypes.length > 0 ? await fetchTokens(tokenTypes) : []

    // Merge costs with rewards
    return rewardsData.map((reward) => {
      const costs =
        costsData
          ?.filter((c) => c.reward_id === reward.id)
          .map((cost) => {
            const token = tokens.find((t) => t.token_type === cost.token_type)
            return {
              reward_id: cost.reward_id,
              token_type: cost.token_type,
              quantity: cost.quantity,
              icon_filename: token?.icon_filename || '',
              icon_color: token?.icon_color || '',
              icon: token?.icon,
            }
          }) || []

      return {
        id: reward.id,
        title: reward.title,
        description: reward.description,
        status: reward.status as RewardStatus,
        created_at: new Date(reward.created_at),
        updated_at: new Date(reward.updated_at),
        costs,
      }
    })
  } catch (err) {
    console.error('Error fetching rewards with costs: ', err)
    throw err
  }
}

async function createRewardWithCosts(payload: {
  title: string
  description?: string
  costs: RewardCost[]
}): Promise<Reward> {
  try {
    const now = new Date().toISOString()
    const { data: rewardData, error: rewardError } = await client
      .from('Reward')
      .insert({
        title: payload.title,
        description: payload.description || null,
        status: RewardStatus.PENDING,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (rewardError) {
      throw rewardError
    }

    // Insert costs
    if (payload.costs.length > 0) {
      const costsData = payload.costs.map((cost) => ({
        reward_id: rewardData.id,
        token_type: cost.token_type,
        quantity: cost.quantity,
      }))

      const { error: costsError } = await client.from('RewardCost').insert(costsData)

      if (costsError) {
        throw costsError
      }
    }

    // Fetch token info for response
    const tokenTypes = payload.costs.map((c) => c.token_type)
    const tokens = tokenTypes.length > 0 ? await fetchTokens(tokenTypes) : []

    const costsWithIcons = payload.costs.map((cost) => {
      const token = tokens.find((t) => t.token_type === cost.token_type)
      return {
        reward_id: rewardData.id,
        token_type: cost.token_type,
        quantity: cost.quantity,
        icon_filename: token?.icon_filename || '',
        icon_color: token?.icon_color || '',
        icon: token?.icon,
      }
    })

    return {
      id: rewardData.id,
      title: rewardData.title,
      description: rewardData.description,
      status: rewardData.status as RewardStatus,
      created_at: new Date(rewardData.created_at),
      updated_at: new Date(rewardData.updated_at),
      costs: costsWithIcons,
    }
  } catch (err) {
    console.error('Error creating reward with costs: ', err)
    throw err
  }
}

async function claimRewardTransaction(rewardId: number, costs: RewardCost[]): Promise<void> {
  try {
    // Fetch current token balances
    const tokenTypes = costs.map((c) => c.token_type)
    const { data: tokens, error: tokensError } = await client
      .from('Token')
      .select('*')
      .in('token_type', tokenTypes)

    if (tokensError) {
      throw tokensError
    }

    // Verify sufficient balances
    for (const cost of costs) {
      const token = tokens.find((t) => t.token_type === cost.token_type)
      if (!token || token.quantity < cost.quantity) {
        throw new Error(`Insufficient ${cost.token_type} tokens`)
      }
    }

    // Decrement token balances
    for (const cost of costs) {
      const token = tokens.find((t) => t.token_type === cost.token_type)
      if (token) {
        const { error: updateError } = await client
          .from('Token')
          .update({ quantity: token.quantity - cost.quantity })
          .eq('token_type', cost.token_type)

        if (updateError) {
          throw updateError
        }
      }
    }

    // Delete reward costs
    const { error: deleteCostsError } = await client
      .from('RewardCost')
      .delete()
      .eq('reward_id', rewardId)

    if (deleteCostsError) {
      throw deleteCostsError
    }

    // Update reward status to CLAIMED
    const { error: updateRewardError } = await client
      .from('Reward')
      .update({ status: RewardStatus.CLAIMED, updated_at: new Date().toISOString() })
      .eq('id', rewardId)

    if (updateRewardError) {
      throw updateRewardError
    }
  } catch (err) {
    console.error('Error in claim reward transaction: ', err)
    throw err
  }
}

async function updateReward(
  rewardId: number,
  updates: { title?: string; description?: string },
): Promise<Reward> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (updates.title !== undefined) {
      updateData.title = updates.title
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description || null
    }

    const { data, error } = await client
      .from('Reward')
      .update(updateData)
      .eq('id', rewardId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status as RewardStatus,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      costs: [], // Costs will be updated separately
    }
  } catch (err) {
    console.error('Error updating reward: ', err)
    throw err
  }
}

async function updateRewardCosts(rewardId: number, costs: RewardCost[]): Promise<RewardCost[]> {
  try {
    // Delete all existing costs for this reward
    const { error: deleteError } = await client
      .from('RewardCost')
      .delete()
      .eq('reward_id', rewardId)

    if (deleteError) {
      throw deleteError
    }

    // Insert new costs
    if (costs.length > 0) {
      const costsData = costs.map((cost) => ({
        reward_id: rewardId,
        token_type: cost.token_type,
        quantity: cost.quantity,
      }))

      const { error: insertError } = await client.from('RewardCost').insert(costsData)

      if (insertError) {
        throw insertError
      }
    }

    // Fetch token info for response
    const tokenTypes = costs.map((c) => c.token_type)
    const tokens = tokenTypes.length > 0 ? await fetchTokens(tokenTypes) : []

    return costs.map((cost) => {
      const token = tokens.find((t) => t.token_type === cost.token_type)
      return {
        reward_id: rewardId,
        token_type: cost.token_type,
        quantity: cost.quantity,
        icon_filename: token?.icon_filename || '',
        icon_color: token?.icon_color || '',
        icon: token?.icon,
      }
    })
  } catch (err) {
    console.error('Error updating reward costs: ', err)
    throw err
  }
}

async function deleteReward(rewardId: number): Promise<void> {
  try {
    // Costs will be cascade deleted by the database
    const { error } = await client.from('Reward').delete().eq('id', rewardId)

    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting reward: ', err)
    throw err
  }
}

// Tag functions
async function fetchAllTags(): Promise<Tag[]> {
  try {
    const { data, error } = await client.from('Tag').select('*').order('name')
    if (error) {
      throw error
    }
    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    }))
  } catch (err) {
    console.error('Error fetching tags: ', err)
    throw err
  }
}

async function createTag(name: string, color?: string): Promise<Tag> {
  const normalized = name.trim().toLowerCase()
  if (!normalized) {
    throw new Error('Tag name cannot be empty')
  }
  try {
    const { data, error } = await client
      .from('Tag')
      .insert({ name: normalized, color: color || '#32a287' })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    }
  } catch (err) {
    console.error('Error creating tag: ', err)
    throw err
  }
}

async function findOrCreateTag(name: string, color?: string): Promise<Tag> {
  const normalized = name.trim().toLowerCase()
  if (!normalized) {
    throw new Error('Tag name cannot be empty')
  }
  try {
    const { data, error } = await client.from('Tag').select('*').eq('name', normalized).single()
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    if (data) {
      return { id: data.id, name: data.name, color: data.color }
    }
    return createTag(normalized, color)
  } catch (err) {
    console.error('Error finding or creating tag: ', err)
    throw err
  }
}

async function updateTag(tagId: number, updates: { name?: string; color?: string }): Promise<Tag> {
  try {
    const payload: Record<string, unknown> = {}
    if (updates.name !== undefined) {
      const normalized = updates.name.trim().toLowerCase()
      if (!normalized) {
        throw new Error('Tag name cannot be empty')
      }
      payload.name = normalized
    }
    if (updates.color !== undefined) {
      payload.color = updates.color
    }

    const { data, error } = await client
      .from('Tag')
      .update(payload)
      .eq('id', tagId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    }
  } catch (err) {
    console.error('Error updating tag: ', err)
    throw err
  }
}

async function deleteTag(tagId: number): Promise<void> {
  try {
    const { error } = await client.from('Tag').delete().eq('id', tagId)
    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting tag: ', err)
    throw err
  }
}

async function fetchTagsForTasks(taskIds: number[]): Promise<Map<number, Tag[]>> {
  if (taskIds.length === 0) {
    return new Map()
  }
  try {
    const { data, error } = await client
      .from('TaskTag')
      .select('task_id, Tag(*)')
      .in('task_id', taskIds)

    if (error) {
      throw error
    }

    const map = new Map<number, Tag[]>()
    for (const row of data || []) {
      const taskId = row.task_id as number
      const tag = row.Tag as unknown as { id: number; name: string; color: string }
      if (!map.has(taskId)) {
        map.set(taskId, [])
      }
      map.get(taskId)!.push({ id: tag.id, name: tag.name, color: tag.color })
    }
    return map
  } catch (err) {
    console.error('Error fetching tags for tasks: ', err)
    throw err
  }
}

async function fetchTagsForQuests(questIds: number[]): Promise<Map<number, Tag[]>> {
  if (questIds.length === 0) {
    return new Map()
  }
  try {
    const { data, error } = await client
      .from('QuestTag')
      .select('quest_id, Tag(*)')
      .in('quest_id', questIds)

    if (error) {
      throw error
    }

    const map = new Map<number, Tag[]>()
    for (const row of data || []) {
      const questId = row.quest_id as number
      const tag = row.Tag as unknown as { id: number; name: string; color: string }
      if (!map.has(questId)) {
        map.set(questId, [])
      }
      map.get(questId)!.push({ id: tag.id, name: tag.name, color: tag.color })
    }
    return map
  } catch (err) {
    console.error('Error fetching tags for quests: ', err)
    throw err
  }
}

async function setTagsForTask(taskId: number, tagIds: number[]): Promise<void> {
  try {
    await client.from('TaskTag').delete().eq('task_id', taskId)
    if (tagIds.length > 0) {
      const rows = tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId }))
      const { error } = await client.from('TaskTag').insert(rows)
      if (error) {
        throw error
      }
    }
  } catch (err) {
    console.error('Error setting tags for task: ', err)
    throw err
  }
}

async function setTagsForQuest(questId: number, tagIds: number[]): Promise<void> {
  try {
    await client.from('QuestTag').delete().eq('quest_id', questId)
    if (tagIds.length > 0) {
      const rows = tagIds.map((tagId) => ({ quest_id: questId, tag_id: tagId }))
      const { error } = await client.from('QuestTag').insert(rows)
      if (error) {
        throw error
      }
    }
  } catch (err) {
    console.error('Error setting tags for quest: ', err)
    throw err
  }
}

async function fetchTagUsageCounts(): Promise<Map<number, number>> {
  try {
    const [{ data: taskData, error: taskError }, { data: questData, error: questError }] =
      await Promise.all([
        client.from('TaskTag').select('tag_id'),
        client.from('QuestTag').select('tag_id'),
      ])

    if (taskError) throw taskError
    if (questError) throw questError

    const counts = new Map<number, number>()
    for (const row of taskData || []) {
      const id = row.tag_id as number
      counts.set(id, (counts.get(id) || 0) + 1)
    }
    for (const row of questData || []) {
      const id = row.tag_id as number
      counts.set(id, (counts.get(id) || 0) + 1)
    }
    return counts
  } catch (err) {
    console.error('Error fetching tag usage counts: ', err)
    throw err
  }
}

// Finance functions
async function fetchTransactionTypes(): Promise<TransactionType[]> {
  try {
    const { data, error } = await client.from('TransactionType').select('*').order('name')
    if (error) {
      throw error
    }
    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      kind: isTransactionKind(t.kind) ? t.kind : TransactionKind.Expense,
      description: t.description,
      createdAt: new Date(t.created_at),
    }))
  } catch (err) {
    console.error('Error fetching transaction types: ', err)
    throw err
  }
}

async function createTransactionType(
  transactionTypeData: CreateTransactionTypeInput,
): Promise<TransactionType> {
  try {
    if (!isTransactionKind(transactionTypeData.kind)) {
      throw new Error(`Invalid transaction kind: ${transactionTypeData.kind}`)
    }

    const { data, error } = await client
      .from('TransactionType')
      .insert({
        name: transactionTypeData.name,
        kind: transactionTypeData.kind,
        description: transactionTypeData.description || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      kind: isTransactionKind(data.kind) ? data.kind : transactionTypeData.kind,
      description: data.description,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error creating transaction type: ', err)
    throw err
  }
}

async function updateTransactionType(
  transactionTypeId: number,
  updates: Partial<Omit<TransactionType, 'id' | 'createdAt'>>,
): Promise<TransactionType> {
  try {
    const payload: Record<string, unknown> = {}
    if (updates.name !== undefined) {
      payload.name = updates.name
    }
    if (updates.kind !== undefined) {
      if (!isTransactionKind(updates.kind)) {
        throw new Error(`Invalid transaction kind: ${updates.kind}`)
      }
      payload.kind = updates.kind
    }
    if (updates.description !== undefined) {
      payload.description = updates.description || null
    }

    const { data, error } = await client
      .from('TransactionType')
      .update(payload)
      .eq('id', transactionTypeId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      kind: isTransactionKind(data.kind) ? data.kind : TransactionKind.Expense,
      description: data.description,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error updating transaction type: ', err)
    throw err
  }
}

async function deleteTransactionType(transactionTypeId: number): Promise<void> {
  try {
    const { error } = await client.from('TransactionType').delete().eq('id', transactionTypeId)
    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting transaction type: ', err)
    throw err
  }
}

async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await client
      .from('Transaction')
      .select('*, TransactionType(*)')
      .order('date', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((item) => {
      const transactionTypeData = item.TransactionType as unknown as {
        id: number
        name: string
        kind: string
        description: string | null
        created_at: string
      } | null
      return {
        id: item.id,
        amount: item.amount,
        transactionTypeId: item.transaction_type_id,
        transactionType: transactionTypeData
          ? {
              id: transactionTypeData.id,
              name: transactionTypeData.name,
              kind: isTransactionKind(transactionTypeData.kind)
                ? transactionTypeData.kind
                : TransactionKind.Expense,
              description: transactionTypeData.description || undefined,
              createdAt: new Date(transactionTypeData.created_at),
            }
          : undefined,
        description: item.description,
        date: new Date(item.date),
        createdAt: new Date(item.created_at),
        source: isTransactionSource(item.source) ? item.source : TransactionSource.Manual,
      }
    })
  } catch (err) {
    console.error('Error fetching transactions: ', err)
    throw err
  }
}

async function createTransaction(transactionData: CreateTransactionInput): Promise<Transaction> {
  try {
    if (!isTransactionSource(transactionData.source)) {
      throw new Error(`Invalid transaction source: ${transactionData.source}`)
    }

    const { data, error } = await client
      .from('Transaction')
      .insert({
        amount: transactionData.amount,
        transaction_type_id: transactionData.transactionTypeId,
        description: transactionData.description,
        date: transactionData.date.toISOString(),
        source: transactionData.source,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      transactionTypeId: data.transaction_type_id,
      description: data.description,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      source: isTransactionSource(data.source) ? data.source : transactionData.source,
    }
  } catch (err) {
    console.error('Error creating transaction: ', err)
    throw err
  }
}

async function updateTransaction(
  transactionId: number,
  updates: Partial<CreateTransactionInput>,
): Promise<Transaction> {
  try {
    const payload: Record<string, unknown> = {}
    if (updates.amount !== undefined) {
      payload.amount = updates.amount
    }
    if (updates.transactionTypeId !== undefined) {
      payload.transaction_type_id = updates.transactionTypeId
    }
    if (updates.description !== undefined) {
      payload.description = updates.description
    }
    if (updates.date !== undefined) {
      payload.date = updates.date.toISOString()
    }
    if (updates.source !== undefined) {
      if (!isTransactionSource(updates.source)) {
        throw new Error(`Invalid transaction source: ${updates.source}`)
      }
      payload.source = updates.source
    }

    const { data, error } = await client
      .from('Transaction')
      .update(payload)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      transactionTypeId: data.transaction_type_id,
      description: data.description,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      source: isTransactionSource(data.source) ? data.source : TransactionSource.Manual,
    }
  } catch (err) {
    console.error('Error updating transaction: ', err)
    throw err
  }
}

async function deleteTransaction(transactionId: number): Promise<void> {
  try {
    const { error } = await client.from('Transaction').delete().eq('id', transactionId)
    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting transaction: ', err)
    throw err
  }
}

async function fetchBudgets(): Promise<Budget[]> {
  try {
    const { data, error } = await client
      .from('Budget')
      .select('*, TransactionType(*)')
      .order('start_date', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((item) => {
      const transactionTypeData = item.TransactionType as unknown as {
        id: number
        name: string
        kind: string
        description: string | null
        created_at: string
      } | null
      return {
        id: item.id,
        transactionTypeId: item.transaction_type_id,
        transactionType: transactionTypeData
          ? {
              id: transactionTypeData.id,
              name: transactionTypeData.name,
              kind: isTransactionKind(transactionTypeData.kind)
                ? transactionTypeData.kind
                : TransactionKind.Expense,
              description: transactionTypeData.description || undefined,
              createdAt: new Date(transactionTypeData.created_at),
            }
          : undefined,
        amount: item.amount,
        period: isBudgetPeriod(item.period) ? item.period : BudgetPeriod.Monthly,
        startDate: new Date(item.start_date),
        endDate: item.end_date ? new Date(item.end_date) : null,
        createdAt: new Date(item.created_at),
      }
    })
  } catch (err) {
    console.error('Error fetching budgets: ', err)
    throw err
  }
}

async function createBudget(budgetData: CreateBudgetInput): Promise<Budget> {
  try {
    if (!isBudgetPeriod(budgetData.period)) {
      throw new Error(`Invalid budget period: ${budgetData.period}`)
    }

    // Enforce expense-only budget constraint at the app layer.
    const { data: typeData, error: typeError } = await client
      .from('TransactionType')
      .select('*')
      .eq('id', budgetData.transactionTypeId)
      .single()
    if (typeError) {
      throw typeError
    }
    const transactionType: TransactionType = {
      id: typeData.id,
      name: typeData.name,
      kind: isTransactionKind(typeData.kind) ? typeData.kind : TransactionKind.Expense,
      description: typeData.description,
      createdAt: new Date(typeData.created_at),
    }
    assertExpenseType(transactionType)

    const { data, error } = await client
      .from('Budget')
      .insert({
        transaction_type_id: budgetData.transactionTypeId,
        amount: budgetData.amount,
        period: budgetData.period,
        start_date: budgetData.startDate.toISOString(),
        end_date: budgetData.endDate?.toISOString() || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      transactionTypeId: data.transaction_type_id,
      amount: data.amount,
      period: isBudgetPeriod(data.period) ? data.period : budgetData.period,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : null,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error creating budget: ', err)
    throw err
  }
}

async function updateBudget(
  budgetId: number,
  updates: Partial<CreateBudgetInput>,
): Promise<Budget> {
  try {
    const payload: Record<string, unknown> = {}

    if (updates.period !== undefined && !isBudgetPeriod(updates.period)) {
      throw new Error(`Invalid budget period: ${updates.period}`)
    }

    // Enforce expense-only budget constraint when the transaction type changes.
    if (updates.transactionTypeId !== undefined) {
      const { data: typeData, error: typeError } = await client
        .from('TransactionType')
        .select('*')
        .eq('id', updates.transactionTypeId)
        .single()
      if (typeError) {
        throw typeError
      }
      const transactionType: TransactionType = {
        id: typeData.id,
        name: typeData.name,
        kind: isTransactionKind(typeData.kind) ? typeData.kind : TransactionKind.Expense,
        description: typeData.description,
        createdAt: new Date(typeData.created_at),
      }
      assertExpenseType(transactionType)
      payload.transaction_type_id = updates.transactionTypeId
    }

    if (updates.amount !== undefined) {
      payload.amount = updates.amount
    }
    if (updates.period !== undefined) {
      payload.period = updates.period
    }
    if (updates.startDate !== undefined) {
      payload.start_date = updates.startDate.toISOString()
    }
    if (updates.endDate !== undefined) {
      payload.end_date = updates.endDate?.toISOString() || null
    }

    const { data, error } = await client
      .from('Budget')
      .update(payload)
      .eq('id', budgetId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      id: data.id,
      transactionTypeId: data.transaction_type_id,
      amount: data.amount,
      period: isBudgetPeriod(data.period) ? data.period : BudgetPeriod.Monthly,
      startDate: new Date(data.start_date),
      endDate: data.end_date ? new Date(data.end_date) : null,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error updating budget: ', err)
    throw err
  }
}

async function deleteBudget(budgetId: number): Promise<void> {
  try {
    const { error } = await client.from('Budget').delete().eq('id', budgetId)
    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting budget: ', err)
    throw err
  }
}

async function fetchUserQueries(): Promise<UserQuery[]> {
  try {
    const { data, error } = await client
      .from('UserQuery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []).map((item) => {
      const dateRangeContext: DateRangeContext | null = isDateRangeContext(item.date_range_context)
        ? item.date_range_context
        : null
      return {
        id: item.id,
        queryText: item.query_text,
        responseText: item.response_text,
        resolvedTransactionIds: item.resolved_transaction_ids || [],
        dateRangeContext,
        createdAt: new Date(item.created_at),
      }
    })
  } catch (err) {
    console.error('Error fetching user queries: ', err)
    throw err
  }
}

async function createUserQuery(userQueryData: CreateUserQueryInput): Promise<UserQuery> {
  try {
    if (
      userQueryData.dateRangeContext !== undefined &&
      userQueryData.dateRangeContext !== null &&
      !isDateRangeContext(userQueryData.dateRangeContext)
    ) {
      throw new Error('Invalid date range context shape')
    }

    const { data, error } = await client
      .from('UserQuery')
      .insert({
        query_text: userQueryData.queryText,
        response_text: userQueryData.responseText,
        resolved_transaction_ids: userQueryData.resolvedTransactionIds,
        date_range_context: userQueryData.dateRangeContext,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    const dateRangeContext: DateRangeContext | null = isDateRangeContext(data.date_range_context)
      ? data.date_range_context
      : null

    return {
      id: data.id,
      queryText: data.query_text,
      responseText: data.response_text,
      resolvedTransactionIds: data.resolved_transaction_ids || [],
      dateRangeContext,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error creating user query: ', err)
    throw err
  }
}

async function updateUserQuery(
  userQueryId: number,
  updates: Partial<CreateUserQueryInput>,
): Promise<UserQuery> {
  try {
    const payload: Record<string, unknown> = {}
    if (updates.queryText !== undefined) {
      payload.query_text = updates.queryText
    }
    if (updates.responseText !== undefined) {
      payload.response_text = updates.responseText
    }
    if (updates.resolvedTransactionIds !== undefined) {
      payload.resolved_transaction_ids = updates.resolvedTransactionIds
    }
    if (updates.dateRangeContext !== undefined) {
      if (updates.dateRangeContext !== null && !isDateRangeContext(updates.dateRangeContext)) {
        throw new Error('Invalid date range context shape')
      }
      payload.date_range_context = updates.dateRangeContext
    }

    const { data, error } = await client
      .from('UserQuery')
      .update(payload)
      .eq('id', userQueryId)
      .select()
      .single()

    if (error) {
      throw error
    }

    const dateRangeContext: DateRangeContext | null = isDateRangeContext(data.date_range_context)
      ? data.date_range_context
      : null

    return {
      id: data.id,
      queryText: data.query_text,
      responseText: data.response_text,
      resolvedTransactionIds: data.resolved_transaction_ids || [],
      dateRangeContext,
      createdAt: new Date(data.created_at),
    }
  } catch (err) {
    console.error('Error updating user query: ', err)
    throw err
  }
}

async function deleteUserQuery(userQueryId: number): Promise<void> {
  try {
    const { error } = await client.from('UserQuery').delete().eq('id', userQueryId)
    if (error) {
      throw error
    }
  } catch (err) {
    console.error('Error deleting user query: ', err)
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
  updateTaskOutcomes,
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
  deleteTask,
  signInWithOtp,
  verifyOtp,
  signOut,
  getSession,
  onAuthStateChange,
  fetchRewardsWithCosts,
  createRewardWithCosts,
  claimRewardTransaction,
  updateReward,
  updateRewardCosts,
  deleteReward,
  fetchAllTags,
  createTag,
  findOrCreateTag,
  updateTag,
  deleteTag,
  fetchTagsForTasks,
  fetchTagsForQuests,
  setTagsForTask,
  setTagsForQuest,
  fetchTagUsageCounts,
  fetchTransactionTypes,
  createTransactionType,
  updateTransactionType,
  deleteTransactionType,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchUserQueries,
  createUserQuery,
  updateUserQuery,
  deleteUserQuery,
}
