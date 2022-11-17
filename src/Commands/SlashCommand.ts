import type { SnowyContext } from '../SnowyContext';
import { BaseCommand, BaseCommandOptions } from './BaseCommand';

/**
 * @classdesc The base class for all slash commands.
 * @extends {SnowyModule}
 */
export abstract class SlashCommand extends BaseCommand {
	public readonly name: string;

	/**
	 *
	 * @param {SnowyContext} context The context of the command.
	 * @param {string} id The ID of the command.
	 * @param {SlashCommandOptions} options The options of the command.
	 */
	public constructor(context: SnowyContext, id: string, options: SlashCommandOptions) {
		super(context, id, options);

		this.name = options.name;
	}
}

export interface SlashCommandOptions extends BaseCommandOptions {
	name: string
}
