import type { ExtendedSnowyModuleConstructor } from './ModuleManager';
import { SnowyContext } from './SnowyContext';
import { ErrorTags, SnowyError } from './SnowyError';
import { getType, isFunction, isObject, isString, Nullable } from './Utils';

/**
 *
 * @classdesc The base class for all modules.
 */
export class SnowyModule {
	/**
	 * The id of the module.
	 * @readonly
	 * @type {string}
	 */
	public readonly id: string;
	/**
	 * Whether the module is reloadable.
	 * @type {boolean}
	 */
	public reloadable!: boolean;
	/**
	 * Path of the module.
	 * @type {Nullable<string>}
	 */
	public readonly path: Nullable<string> = null;
	/**
	 * Category of the module.
	 * @type {Nullable<string>}
	 */
	public readonly category?: Nullable<string>;

	/**
	 * The context of the module.
	 * @type {SnowyContext}
	 */
	readonly context: SnowyContext;

	/**
	 *
	 * @param {SnowyContext} context The context of the module.
	 * @param {SnowyModuleOptions} options The options of the module.
	 */
	public constructor(context: SnowyContext, id: string, options: SnowyModuleOptions) {
		if (!(context instanceof SnowyContext))
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_INSTANCE_OF_DESIRED_CLASS, 'SnowyContext', 'context', getType(context));
		if (!isString(id))
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'string', 'id', getType(id));

		if (!isObject<SnowyModuleOptions>(options))
			throw new SnowyError(ErrorTags.InvalidArgument, 'options', 'The options must be an object.');

		this.context = context;
		this.id = id;
		this.reloadable = options.reloadable ?? true;
		this.category = options.category ?? null;
	}

	/**
	 *
	 * Remove this module.
	 * @returns {void}
	 */
	public remove(): void {
		this.context.manager.remove(this.id);
	}

	/**
	 *
	 * Reload this module.
	 * @returns {Promise<void>}
	 */
	public async reload(): Promise<void> {
		await this.context.manager.reload(this.id);
	}

	public exec(..._: unknown[]): unknown {
		throw new SnowyError(ErrorTags.METHOD_NOT_IMPLEMENTED, 'SnowyModule', 'exec');
	}

	/**
	 *
	 * @param {unknown} value The value to check
	 * @returns {boolean} Whether the value is a SnowyModule
	 */
	public static isSnowyModuleConstructor(value: unknown): value is ExtendedSnowyModuleConstructor {
		return isFunction(value) && value.prototype instanceof SnowyModule;
	}
}

export interface SnowyModuleOptions {
	reloadable?: boolean
	category?: string | null
}

export interface BaseExtendedSnowyModule<T extends Record<PropertyKey, unknown>> extends SnowyModule {
	new(context: SnowyContext, options: SnowyModuleOptions & T): SnowyModule
}
