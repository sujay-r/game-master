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

export interface TaskType {
  title: string,
  description: string,
  status: TaskStatus,
  notes: string,
  createdAt: string,
  id?: number,
  questId?: number,
}
