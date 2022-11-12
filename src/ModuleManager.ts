import { EventEmitter } from 'node:events';
import type { SnowyModule } from './SnowyModule';
import { UniqueMap } from './UniqueMap';

/**
 * @classdesc The manager class for the bot.
 * @extends {EventEmitter}
 */
export class ModuleManager extends EventEmitter {
	#modules = new UniqueMap<string, SnowyModule>();

	public get modules(): UniqueMap<string, SnowyModule> { return this.#modules; }
}
