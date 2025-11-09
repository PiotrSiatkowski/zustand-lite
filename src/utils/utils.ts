export const identity = (arg: any) => arg
export const pick = (obj: Record<string, any>, keys: string[]) =>
	keys.reduce<Record<string, any>>((acc, k) => (k in obj ? ((acc[k] = obj[k]), acc) : acc), {})
