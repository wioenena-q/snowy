import type { SnowyContext } from '../SnowyContext';
import { ErrorTags, SnowyError } from '../SnowyError';
import { SnowyModule, SnowyModuleOptions } from '../SnowyModule';
import { isString } from '../Utils';

/**
 * @classdesc The listener class for events.
 * @extends {SnowyModule}
 */
export abstract class Listener extends SnowyModule {
	#emitter!: string;
	#event!: string;
	#type: 'on' | 'once';

	public constructor(context: SnowyContext, id: string, options: ListenerOptions) {
		super(context, id, options);
		this.#emitter = options.emitter;
		this.#event = options.event;
		if (isString(options.type))
			if (!['on', 'once'].includes(options.type)) throw new SnowyError(ErrorTags.INVALID_LISTENER_TYPE, options.type);
			else this.#type = options.type;
		else this.#type = 'once';
	}

	public abstract override exec(...args: unknown[]): unknown;

	/**
	 * @returns {string} The emitter of the listener.
	 */
	public get emitter(): string { return this.#emitter; }
	/**
	 * @returns {string} The event of the listener.
	 */
	public get event(): string { return this.#event; }
	/**
	 * @returns {string} The type of the listener.
	 */
	public get type(): string { return this.#type; }
}

export interface ListenerOptions extends SnowyModuleOptions {
	emitter: string
	event: string
	type?: 'on' | 'once'
}
