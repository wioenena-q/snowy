import type { Client } from './Client';
import type { ModuleManager } from './ModuleManager';

export class SnowyContext {
	#client: Client;
	#manager: ModuleManager;

	public constructor(client: Client, manager: ModuleManager) {
		this.#client = client;
		this.#manager = manager;
	}

	/**
	 * @returns {Client} The client.
	 */
	public get client(): Client { return this.#client; }
	/**
	 * @returns {ModuleManager} The module manager.
	 */
	public get manager(): ModuleManager { return this.#manager; }
}
