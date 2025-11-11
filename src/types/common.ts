export interface StatusEffectType {
  buff: boolean,
  text: string,
  id?: number
}

export interface StatType {
  id: number,
  name: string,
  value: number,
  effects: StatusEffectType[]
}

export enum TaskStatus {
  Todo = "TODO",
  InProgress = "IN_PROGRESS",
  Done = "DONE"
}

export interface TaskOutcomeType {
  token_type: string,
  quantity: string,
  icon_filename: string,
  icon_color: string,
  icon?: string
}

export interface TaskType {
  title: string,
  description: string,
  status: TaskStatus,
  notes: string,
  createdAt: Date,
  dueDate?: Date | null,
  outcomes?: TaskOutcomeType[],
  id?: number,
  questId?: number,
}
