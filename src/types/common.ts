export interface StatusEffectType {
  buff: boolean,
  text: string
}

export interface StatType {
  id: number,
  name: string,
  value: number,
  effects: StatusEffectType[]
}
