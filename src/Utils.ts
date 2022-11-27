
export const isObject = <T extends object>(value: unknown): value is T => {
	return !Array.isArray(value) && typeof value === 'object' && value !== null;
};

export const isFunction = <R>(value: unknown): value is (...args: unknown[]) => R =>
	typeof value === 'function';

export const isString = (value: unknown): value is string => typeof value === 'string';

export const getType = (value: unknown, arrType?: string): string => {
	if (Array.isArray(value)) return `Array<${arrType ?? 'unknown'}>`;
	if (value === null) return 'null';
	return typeof value;
};

export const toTheCallable = (value: unknown): Function => {
	if (isFunction(value)) return value;
	const toTheCallableWrapper = () => value;;
	return toTheCallableWrapper;
};

export const toTheArray = <T>(value: unknown): T[] => {
	if (Array.isArray(value)) return value;
	return [value as T];
};

export type MaybeArray<T> = T | T[];

export type Nullable<T> = T | null;

export type MaybePromise<T> = T | Promise<T>;
