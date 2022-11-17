import type { SnowyContext } from '../SnowyContext';
import { SnowyModule, SnowyModuleOptions } from '../SnowyModule';
import type { Nullable } from '../Utils';
import type { CommandContext } from './CommandContext';

export abstract class BaseCommand extends SnowyModule {
	/**
	 *
	 * The description of the command.
	 * @type {string}
	 */
	public description: Nullable<string>;

	public constructor(context: SnowyContext, id: string, options: BaseCommandOptions) {
		super(context, id, options);

		this.description = options.description ?? null;
	}

	public abstract override exec(context: CommandContext): unknown;
}

export interface BaseCommandOptions extends SnowyModuleOptions {
	description?: string
}
