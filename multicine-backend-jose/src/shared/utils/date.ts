export const isFuture = (value: Date | string): boolean => new Date(value).getTime() > Date.now()
export const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10)
