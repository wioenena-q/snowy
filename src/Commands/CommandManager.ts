import type { Client } from '../Client';
import { ModuleManager, ModuleManagerOptions } from '../ModuleManager';

/**
 * @classdesc The manager class for the bot commands.
 * @extends {ModuleManager}
 */
export class CommandManager extends ModuleManager {
	public constructor(client: Client, options: CommandManagerOptions) {
		super(client, options);
	}

	public override async loadModules(filter?: (_path: string) => boolean): Promise<this> {
		await super.loadModules(filter);
		this.context.client.once('ready', () => {
			this.context.client.on('messageCreate', async (_message) => {
				// TODO: Implement command handling.
			});

			this.context.client.on('interactionCreate', (_interaction) => {
				// TODO: Implement slash command handling.
			});
		});
		return this;
	}
}

export interface CommandManagerOptions extends ModuleManagerOptions {
}
