export const isSameDay = (date1: Date, date2: Date | string): boolean =>
  new Date(date1).toDateString() === new Date(date2).toDateString()

export const isBefore = (date1: Date, date2: Date | string): boolean =>
  new Date(date1) < new Date(date2)

export const getDaysOverdue = (dueDate: Date): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = today.getTime() - due.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isOverdue = (date: Date | undefined | null): boolean => {
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}
