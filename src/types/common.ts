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
