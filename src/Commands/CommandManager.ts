import type { Message, PartialMessage, PermissionsString } from 'discord.js';
import type { Client } from '../Client';
import { ModuleManager, ModuleManagerEvents, ModuleManagerLoadFilterFunction, ModuleManagerOptions } from '../ModuleManager';
import { UniqueMap } from '../UniqueMap';
import { MaybeArray, MaybePromise, Nullable, toTheArray, toTheCallable } from '../Utils';
import { RawCommand, RawCommandPrefixFunction, ValidPrefixesDefinitions } from './RawCommand';
import type { SlashCommand } from './SlashCommand';

/**
 * @classdesc The manager class for the bot commands.
 * @extends {ModuleManager}
 */
export class CommandManager extends ModuleManager {
	readonly aliases: UniqueMap<string> = new UniqueMap();
	readonly prefixes = new Map<Function, Set<string>>();
	readonly prefix: CommandManagerPrefixFunction;
	readonly allowEdits: boolean;
	readonly allowMention: boolean;
	readonly guildOnly: boolean;

	public constructor(client: Client, options: CommandManagerOptions) {
		super(client, options);
		this.prefix = toTheCallable(options.prefix ?? ['?']).bind(this);
		this.allowEdits = options.allowEdits ?? false;
		this.allowMention = options.allowMention ?? false;
		this.guildOnly = options.guildOnly ?? false;
	}

	/**
	 *
	 * Register a command.
	 * @param {RawCommand | SlashCommand} command The command to register.
	 * @param {boolean?} [isReload] Whether the command is being reloaded.
	 * @returns {this}
	 */
	public override register(command: RawCommand | SlashCommand, isReload?: boolean): this {
		if (command instanceof RawCommand) {
			command.aliases.forEach(alias => this.aliases.set(alias, command.id));
			command.prefix = toTheCallable(command.prefix).bind(command);
			this.prefixes.set((command.prefix as RawCommandPrefixFunction), new Set([command.id]));
			command.userPermissions = toTheCallable(command.userPermissions).bind(command);
			command.botPermissions = toTheCallable(command.botPermissions).bind(command);
		}
		return super.register(command, isReload);
	}

	/**
	 * Load a modules.
	 * @param {ModuleManagerLoadFilterFunction} filter The filter function.
	 * @returns {Promise<this>}
	 */
	public override async loadModules(filter?: ModuleManagerLoadFilterFunction): Promise<this> {
		await super.loadModules(filter);
		this.context.client.once('ready', () => {
			this.context.client.on('messageCreate', async (message) => {
				void this.handle(message);
			});

			if (this.allowEdits)
				this.context.client.on('messageUpdate', async (oldMessage, newMessage) => {
					if (oldMessage.content === newMessage.content) return;

					void this.handle(newMessage);
				});

			this.context.client.on('interactionCreate', (_interaction) => {
				// TODO: Implement slash command handling.
			});
		});
		return this;
	}

	/**
	 * Handles a message.
	 * @param {Message | PartialMessage} message Message to handle.
	 * @returns {Promise<void>}
	 */
	private async handle(message: Message | PartialMessage) {
		if (message.partial) await message.fetch();

		const { command, args } = await this.parseCommand(message as Message);

		if (command === null) return;
		console.log(command.id, args);
	}

	/**
	 * Parse a command from message content.
	 * @param {Message} message Message to parse.
	 * @returns {Promise<ParsedCommand>}
	 */
	private async parseCommand(message: Message): Promise<ParsedCommand> {
		const result: ParsedCommand = {
			args: null,
			command: null
		};

		let prefixes = toTheArray<string>(await this.prefix(message));

		if (this.allowMention) {
			const mentions = [`<@${this.context.client.user!.id}>`, `<@!${this.context.client.user!.id}>`];
			prefixes.push(...mentions);
		}

		let prefix = this.findPrefixFromArray(message, prefixes);

		// Find the command prefixes.
		if (prefix === null)
			for (const [prefixFn, cmdIds] of this.prefixes) {
				prefixes = toTheArray<string>(await prefixFn(message));
				prefix = this.findPrefixFromArray(message, prefixes);

				if (prefix === null) continue;
				result.args = message.content.slice(prefix.length).trim().split(/\s+/g);
				const cmdIdFromMsg = result.args.shift()!;
				for (const cmdId of cmdIds) {
					const alias = this.aliases.get(cmdIdFromMsg);

					if (alias === cmdId) {
						result.command = this.modules.get(cmdId) as RawCommand;
						return result;
					}
				}
			}
		else {
			result.args = message.content.slice(prefix.length).trim().split(/\s+/g);
			const cmdIdFromMsg = result.args.shift()!;
			const alias = this.aliases.get(cmdIdFromMsg);
			if (!alias) return result;
			result.command = this.modules.get(alias) as RawCommand;
		}

		return result;
	}

	/**
	 * Find a prefix from an array of prefixes.
	 * @param message Message to find prefix from.
	 * @param prefixes Prefixes to find.
	 * @returns {Nullable<string>}
	 */
	private findPrefixFromArray(message: Message, prefixes: string[]) {
		return prefixes.find(prefix => message.content.startsWith(prefix)) ?? null;
	}
}

export interface CommandManagerOptions extends ModuleManagerOptions {
	/**
	 * The prefixes to use.
	 */
	prefix?: ValidPrefixesDefinitions
	/**
	 * So they can use the commands by tagging the bot. (Not for slash commands)
	 */
	allowMention?: boolean

	/**
	 * Whether to allow edits to run the command. (Not for slash commands)
	 */
	allowEdits?: boolean

	/**
	 * Whether to run commands only on the guild.
	 */
	guildOnly?: boolean
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

interface ParsedCommand {
	command: Nullable<RawCommand>
	args: Nullable<string[]>
}
