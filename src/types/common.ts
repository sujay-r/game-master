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

export interface TokenType {
  token_type: string
  quantity: number
  icon_filename: string
  icon_color: string
  icon?: string
}

export interface TaskOutcomeType {
  token_type: string
  quantity: string
  icon_filename: string
  icon_color: string
  icon?: string
}

export interface TaskType {
  title: string
  description: string
  status: TaskStatus
  notes: string
  createdAt: Date
  dueDate?: Date | null
  outcomes?: TaskOutcomeType[]
  id?: number
  questId?: number
}
