import type { Client } from './Client';
import type { ModuleManager } from './ModuleManager';

export class SnowyContext {
	/**
	 * @type {Client} The client.
	 */
	client: Client;
	/**
	 * @type {ModuleManager} The module manager.
	 */
	manager: ModuleManager;

	public constructor(client: Client, manager: ModuleManager) {
		this.client = client;
		this.manager = manager;
	}
}
