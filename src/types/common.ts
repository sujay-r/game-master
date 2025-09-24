export interface StatusEffectType {
  buff: boolean,
  text: string
}

export interface StatType {
  statName: string,
  stat: number,
  effects: StatusEffectType[]
}
