import type { Message, PermissionsString } from 'discord.js';
import type { SnowyContext } from '../SnowyContext';
import { ErrorTags, SnowyError } from '../SnowyError';
import { getType, MaybeArray, MaybePromise } from '../Utils';
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
	 * Whether to run the command in only one guild
	 * @type {boolean}
	 */
	public guildOnly: boolean;

	/**
	 * The prefixes for the command.
	 * @type {ValidPrefixesDefinitions}
	 */
	public prefix?: ValidPrefixesDefinitions | null;
	/**
	 *
	 * The permissions of the user using the command.
	 * @type {ValidPermissionDefinitions | null}
	 */
	public userPermissions?: MaybeArray<PermissionsString> | RawCommandPermissionFunction | null;
	/**
	 *
	 * The permissions of the bot for the command.
	 * @type {ValidPermissionDefinition | null}
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
			throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'Array<string>', 'aliases', getType(options.aliases));

		this.aliases = options.aliases;
		this.guildOnly = options.guildOnly ?? false;
		this.prefix = options.prefix ?? null;
		this.userPermissions = options.userPermissions ?? null;
		this.botPermissions = options.botPermissions ?? null;
	}
}

export interface RawCommandOptions extends BaseCommandOptions {
	aliases: string[]
	guildOnly?: boolean
	prefix?: ValidPrefixesDefinitions
	userPermissions?: ValidPermissionDefinitions
	botPermissions?: ValidPermissionDefinitions
}

export type RawCommandPrefixFunction = (message: Message) => MaybePromise<MaybeArray<string>>;

export type ValidPrefixesDefinitions = MaybeArray<string> | RawCommandPrefixFunction;

export type RawCommandPermissionFunction = (message: Message) => MaybePromise<boolean>;

export type ValidPermissionDefinitions = MaybeArray<PermissionsString> | RawCommandPermissionFunction;
