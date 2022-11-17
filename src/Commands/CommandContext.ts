import type { Message } from 'discord.js';

export class CommandContext {
	/**
	 *
	 * @param {Message} message The message that triggered the command.
	 */
	public constructor(public readonly message: Message) { }
}
