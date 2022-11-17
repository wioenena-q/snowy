import type { Message, PermissionsString } from 'discord.js';
import type { SnowyContext } from '../SnowyContext';
import { ErrorTags, SnowyError } from '../SnowyError';
import type { MaybeArray } from '../Utils';
import { BaseCommand, BaseCommandOptions } from './BaseCommand';

export abstract class RawCommand extends BaseCommand {
	/**
	 *
	 * Aliases for the command.
	 * @type {string[]}
	 */
	public aliases: string[];
	/**
	 *
	 * The permissions of the user using the command.
	 * @type {MaybeArray<PermissionsString> | RawCommandPermissionFunction | null}
	 */
	public userPermissions?: MaybeArray<PermissionsString> | RawCommandPermissionFunction | null;
	/**
	 *
	 * The permissions of the bot for the command.
	 * @type {MaybeArray<PermissionsString> | RawCommandPermissionFunction | null}
	 */
	public botPermissions?: MaybeArray<PermissionsString> | RawCommandPermissionFunction | null;

	/**
	 *
	 * @param {SnowyContext} context The context of the command.
	 * @param {string} id The ID of the command.
	 * @param {RawCommandOptions} options The options of the command.
	 */
	public constructor(context: SnowyContext, id: string, options: RawCommandOptions) {
		super(context, id, options);

		if (!Array.isArray(options.aliases))
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'Array<string>', 'aliases', typeof options.aliases);

		this.aliases = options.aliases;
		this.userPermissions = options.userPermissions ?? null;
		this.botPermissions = options.botPermissions ?? null;
	}
}

export interface RawCommandOptions extends BaseCommandOptions {
	aliases: string[]
	userPermissions?: MaybeArray<PermissionsString> | RawCommandPermissionFunction
	botPermissions?: MaybeArray<PermissionsString> | RawCommandPermissionFunction
}

export type RawCommandPermissionFunction = (message: Message) => boolean | Promise<boolean>;
