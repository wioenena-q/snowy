
export const isObject = <T extends object>(value: unknown): value is T => {
	return !Array.isArray(value) && typeof value === 'object' && value !== null;
};

export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
	typeof value === 'function';

export const isString = (value: unknown): value is string => typeof value === 'string';
