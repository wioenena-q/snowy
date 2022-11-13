import type { EventEmitter } from 'node:events';
import type { Client } from '../Client';
import { ModuleManager, ModuleManagerOptions } from '../ModuleManager';
import { ErrorTags, SnowyError } from '../SnowyError';
import { UniqueMap } from '../UniqueMap';
import type { Listener } from './Listener';

/**
 * @classdesc The listener manager for bot.
 * @extends {ModuleManager}
 */
export class ListenerManager extends ModuleManager {
	#emitters: UniqueMap<string, EventEmitter>;

	/**
	 *
	 * @param client The client of the listener manager.
	 * @param options The options of the listener manager.
	 */
	public constructor(client: Client, options: ListenerManagerOptions) {
		super(client, options);
		this.#emitters = new UniqueMap();
	}

	/**
	 * Add an emitter to the listener manager.
	 * @param {string} id The id of the emitter. Determined by emitter ids targeted by events
	 * @param {EventEmitter} emitter The emitter.
	 */
	public addEmitter(id: string, emitter: EventEmitter): void {
		this.#emitters.set(id, emitter);
	}

	/**
	 * Remove listener from the listener manager.
	 * @param modOrId The module or the id of the module.
	 * @returns {Listener}
	 */
	public override remove(modOrId: string | Listener): Listener {
		const mod = super.remove(modOrId) as Listener;
		const emitter = this.#emitters.get(mod.emitter);
		if (!emitter) throw new SnowyError(ErrorTags.EMITTER_NOT_FOUND, mod.emitter);
		emitter.removeListener(mod.event, mod.exec);
		return mod;
	}

	/**
	 * Register a listener.
	 * @param mod The listener to register.
	 * @param isReload Whether the listener is being reloaded.
	 */
	public override register(mod: Listener, isReload?: boolean): this {
		super.register(mod, isReload);
		const emitter = this.#emitters.get(mod.emitter);
		if (!emitter) throw new SnowyError(ErrorTags.EMITTER_NOT_FOUND, mod.emitter);
		if (mod.type === 'on') emitter.on(mod.event, mod.exec);
		else emitter.once(mod.event, mod.exec);
		return this;
	}

	/**
	 * Add emitters to the listener manager.
	 * @param {Record<string, EventEmitter>} emitters The emitters to add.
	 */
	public addEmitters(emitters: Record<string, EventEmitter>): void {
		for (const [id, emitter] of Object.entries(emitters))
			this.addEmitter(id, emitter);
	}
}

export interface ListenerManagerOptions extends ModuleManagerOptions {
}
