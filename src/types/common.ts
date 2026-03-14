export interface StatusEffectType {
  buff: boolean
  text: string
  id?: number
}

export interface StatType {
  id: number
  name: string
  value: number
  effects: StatusEffectType[]
}

export enum TaskStatus {
  Todo = 'TODO',
  InProgress = 'IN_PROGRESS',
  Done = 'DONE',
}

export enum QuestType {
  Main = 'main',
  Side = 'side',
  LifeAdmin = 'lifeAdmin',
}

export enum QuestStatus {
  Active = 'active',
  Completed = 'completed',
  Todo = 'todo',
}

export interface Quest {
  id: number
  title: string
  description?: string
  notes?: string
  type: QuestType
  status: QuestStatus
  createdAt: Date
  updatedAt: Date
  taskIds: number[]
}

export interface Icon {
  icon_filename: string
  icon_color: string
  icon?: string
}

export interface TokenType extends Icon {
  token_type: string
  quantity: number
}

export interface TaskOutcomeType extends Icon {
  token_type: string
  quantity: string
}

export enum RewardStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
}

export interface RewardCost extends Icon {
  reward_id: number
  token_type: string
  quantity: number
}

export interface Reward {
  id: number
  title: string
  description?: string
  status: RewardStatus
  created_at: Date
  updated_at: Date
  costs: RewardCost[]
}

export interface TaskType {
  title: string
  description: string
  status: TaskStatus
  notes: string
  createdAt: Date
  dueDate?: Date | null
  completedAt?: Date | null
  outcomes?: TaskOutcomeType[]
  id?: number
  questId?: number
}
