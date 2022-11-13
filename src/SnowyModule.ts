import type { ExtendedSnowyModuleConstructor } from './ModuleManager';
import { SnowyContext } from './SnowyContext';
import { ErrorTags, SnowyError } from './SnowyError';
import { isFunction, isObject, isString } from './Utils';

/**
 *
 * @classdesc The base class for all modules.
 */
export class SnowyModule implements SnowyModuleOptions {
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
	public path: string | null = null;
	#context: SnowyContext;

	/**
	 *
	 * @param {SnowyContext} context The context of the module.
	 * @param {SnowyModuleOptions} options The options of the module.
	 */
	public constructor(context: SnowyContext, id: string, options: SnowyModuleOptions) {
		if (!(context instanceof SnowyContext))
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_INSTANCE_OF_DESIRED_CLASS, 'SnowyContext', 'context', typeof context);

		if (!isString(id)) throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'string', 'id', typeof id);

		this.#context = context;
		this.id = id;
		this.initialize(options);
	}

	/**
	 *
	 * Remove this module.
	 * @returns {void}
	 */
	public remove(): void {
		this.#context.manager.remove(this.id);
	}

	/**
	 *
	 * Reload this module.
	 * @returns {Promise<void>}
	 */
	public async reload(): Promise<void> {
		await this.#context.manager.reload(this.id);
	}

	/**
	 *
	 * Initialize props to module.
	 * @param {SnowyModuleOptions} options The options of the module.
	 */
	protected initialize(options: SnowyModuleOptions): void {
		if (!isObject<SnowyModuleOptions>(options))
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'object', 'options', typeof options);
		this.reloadable = options.reloadable ?? true;
	}

	/**
	 *
	 * @param {unknown} value The value to check
	 * @returns {boolean} Whether the value is a SnowyModule
	 */
	public static isSnowyModuleConstructor(value: unknown): value is ExtendedSnowyModuleConstructor {
		return isFunction(value) && value.prototype instanceof SnowyModule;
	}

	/**
	 * The context of the module.
	 */
	public get context(): SnowyContext {
		return this.#context;
	}
}

export interface SnowyModuleOptions {
	reloadable?: boolean
}

export interface BaseExtendedSnowyModule<T extends Record<PropertyKey, unknown>> extends SnowyModule {
	new(context: SnowyContext, options: SnowyModuleOptions & T): SnowyModule
}
