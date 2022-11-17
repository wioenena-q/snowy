import type { GuildMember, Message, PermissionsString } from 'discord.js';
import type { Client } from '../Client';
import { ModuleManager, ModuleManagerEvents, ModuleManagerLoadFilterFunction, ModuleManagerOptions } from '../ModuleManager';
import { ErrorTags, SnowyError } from '../SnowyError';
import { UniqueMap } from '../UniqueMap';
import { getType, isFunction, isString, MaybeArray, MaybePromise, Nullable } from '../Utils';
import { RawCommand, ValidPermissionDefinitions } from './RawCommand';
import type { SlashCommand } from './SlashCommand';

/**
 * @classdesc The manager class for the bot commands.
 * @extends {ModuleManager}
 */
export class CommandManager extends ModuleManager {
	public readonly prefix: MaybeArray<string> | CommandManagerPrefixFunction;
	#aliases: UniqueMap<string, string> = new UniqueMap();

	public constructor(client: Client, options: CommandManagerOptions) {
		super(client, options);

		this.prefix = options.prefix;
	}

	/**
	 *
	 * Register a command.
	 * @param {RawCommand | SlashCommand} command The command to register.
	 * @param {boolean?} [isReload] Whether the command is being reloaded.
	 * @returns {this}
	 */
	public override register(command: RawCommand | SlashCommand, isReload?: boolean): this {
		if (command instanceof RawCommand)
			command.aliases.forEach(alias => {
				if (!this.aliases.has(alias))
					this.aliases.set(alias, command.id);
			});

		return super.register(command, isReload);
	}

	/**
	 * Load a modules.
	 * @param {ModuleManagerLoadFilterFunction} filter The filter function.
	 * @returns
	 */
	public override async loadModules(filter?: ModuleManagerLoadFilterFunction): Promise<this> {
		await super.loadModules(filter);
		this.context.client.once('ready', () => {
			this.context.client.on('messageCreate', async (message) => {
				const prefix = await this.getPrefix(message);
				if (prefix === null && !message.mentions.users.has(this.context.client.user!.id)) return;
				const { commandName, args } = this.getCommandNameAndArgs(prefix, message.content);

				if (!isString(commandName)) return;

				const alias = this.aliases.get(commandName);
				if (!alias) return;
				const command = this.modules.get(alias) as RawCommand;
				if (!command) return;

				if (command.botPermissions !== null) {
					const missing = await this.hasPermissions(command.botPermissions!, message, message.guild!.members.me!) as PermissionsString[];
					if (missing !== null) {
						this.emit('missingPermissions', message, command, isFunction(command.botPermissions) ? null : missing, 'client');
						return;
					}
				}

				if (command.userPermissions !== null) {
					const missing = await this.hasPermissions(command.userPermissions!, message) as PermissionsString[];
					if (missing !== null) {
						this.emit('missingPermissions', message, command, isFunction(command.userPermissions) ? null : missing, 'user');
						return;
					}
				};
			});

			this.context.client.on('interactionCreate', (_interaction) => {
				// TODO: Implement slash command handling.
			});
		});
		return this;
	}

	/**
	 *
	 * Checks if the given member|bot has the given permissions.
	 * @param {ValidPermissionDefinitions} perms The permissions to check.
	 * @param {Message} message The message to check the permissions for.
	 * @param {GuildMember?} [member] The member to check the permissions for.
	 * @returns {Promise<boolean>} Whether the member|bot has the permissions.
	 */
	private async hasPermissions(perms: ValidPermissionDefinitions, message: Message, member?: GuildMember): Promise<unknown> {
		if (isFunction<boolean>(perms))
			return perms(message);
		else {
			member = member ?? message.member as GuildMember;
			if (member.permissions.has(perms as PermissionsString))
				return null;
			else
				return member.permissions.missing(perms as PermissionsString);
		}
	};

	/**
	 *
	 * Gets the command name and arguments from the given message content.
	 * @param {Nullable<string>} prefix The prefix of the message.
	 * @param {string} content The content of the message.
	 * @returns {{ commandName: Nullable<string>; args: string[]}} The command name and arguments.
	 */
	private getCommandNameAndArgs(prefix: Nullable<string>, content: string): { commandName: Nullable<string>, args: string[] } {
		let commandName: Nullable<string> = null;

		if (prefix !== null)
			content = content.slice(prefix.length);
		else
			content = content
				.replace(/<@!?(\d+)>/g, (_, id: string) => id === this.context.client.user!.id ? '' : `<@${id}>`);

		const args = content.trim().split(/\s+/g);
		commandName = args.shift() ?? null;

		return { commandName, args };
	}

	/**
	 * Gets the prefix for the given message.
	 * @param {Message} message The message to get the prefix from.
	 * @returns {Promise<string | null>} The prefix for the message.
	 */
	private async getPrefix(message: Message): Promise<string | null> {
		let prefix: Nullable<string> = null;

		if (isFunction<string>(this.prefix)) {
			const ret = await this.prefix(message);
			if (Array.isArray(ret))
				prefix = ret.find(p => message.content.startsWith(p)) ?? null;
			else if (!isString(ret))
				throw new SnowyError(ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE, 'string', 'prefix', getType(ret));
			else
				if (message.content.startsWith(ret))
					prefix = ret;
		} else if (Array.isArray(this.prefix))
			prefix = this.prefix.find((p) => message.content.startsWith(p)) as string ?? null;
		else if (isString(this.prefix) && message.content.startsWith(this.prefix))
			prefix = this.prefix;

		return prefix;
	}

	public get aliases(): UniqueMap<string, string> { return this.#aliases; }
}

export interface CommandManagerOptions extends ModuleManagerOptions {
	prefix: MaybeArray<string> | CommandManagerPrefixFunction
	allowMention?: boolean
}

export type CommandManagerPrefixFunction = (message: Message) => MaybePromise<MaybeArray<string>>;

export interface CommandManager extends ModuleManager {
	on: <E extends keyof CommandManagerEvents>(event: E, listener: CommandManagerEvents[E]) => this
	once: <E extends keyof CommandManagerEvents>(event: E, listener: CommandManagerEvents[E]) => this
	emit: <E extends keyof CommandManagerEvents>(event: E, ...args: Parameters<CommandManagerEvents[E]>) => boolean
	removeAllListener: <E extends keyof CommandManagerEvents>(event: E, listener: CommandManagerEvents[E]) => this
	removeAllListeners: <E extends keyof CommandManagerEvents>(event: E) => this
}

export interface CommandManagerEvents extends ModuleManagerEvents {
	'missingPermissions': (message: Message, command: RawCommand, missing: PermissionsString[] | null, type: 'client' | 'user') => void
}
