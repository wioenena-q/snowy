import { EventEmitter } from 'node:events';
import { readdirSync, type Dirent } from 'node:fs';
import { join, sep } from 'node:path';
import type { Client } from './Client';
import { SnowyContext } from './SnowyContext';
import { ErrorTags, SnowyError } from './SnowyError';
import { SnowyModule, SnowyModuleOptions } from './SnowyModule';
import { UniqueMap } from './UniqueMap';
import { isObject, isString } from './Utils';

/**
 * @classdesc The manager class for the bot.
 * @extends {EventEmitter}
 */
export class ModuleManager extends EventEmitter {
	/**
	 * @type {UniqueMap<string, SnowyModule>} The modules of the bot.
	 */
	readonly modules: UniqueMap<SnowyModule>;
	readonly path: string;
	readonly automateCategories: boolean;
	/**
	 * @type {SnowyContext} The context of the manager.
	 */
	readonly context: SnowyContext;

	/**
	 *
	 * @param options The options of the manager.
	 */
	public constructor(client: Client, options: ModuleManagerOptions) {
		super();
		if (!isObject<ModuleManagerOptions>(options))
			throw new SnowyError(ErrorTags.InvalidArgument, 'options', 'The options must be an object.');

		this.modules = new UniqueMap();
		this.context = new SnowyContext(client, this);
		this.path = options.path;
		this.automateCategories = options.automateCategories ?? false;
	}

	/**
	 * Reads the module directory and returns the file paths of the modules.
	 * @returns {string[]} The paths of the modules.
	 */
	public getModuleFilePaths(): string[] {
		const result = [] as string[];

		; (function readDir(path: string) {
			const files = readdirSync(path, { withFileTypes: true });
			files.forEach((file: Dirent) => {
				const filePath = join(path, file.name);
				if (file.isDirectory()) readDir(filePath);
				else result.push(filePath);
			});
		})(this.path);

		return result;
	}

	/**
	 * Load a module.
	 * @param {string} path The path of the module.
	 * @returns {Promise<SnowyModule|undefined>} The module.
	 */
	public async loadModule(path: string, isReload = false): Promise<SnowyModule | undefined> {
		const { default: mod } = await import(path);

		if (mod === undefined) return;
		// Create a new instance of the module.
		if (SnowyModule.isSnowyModuleConstructor(mod)) {
			// eslint-disable-next-line new-cap
			const instance = new mod(this.context, {
				path
			});

			// Set props.
			Reflect.set(instance, 'path', path);

			if (this.automateCategories && !isString(instance.category)) {
				const category = path.split(sep).slice(-2).at(0);
				if (category !== undefined) Reflect.set(instance, 'category', category);
			}

			this.register(instance, isReload);
			return instance;
		}
	}

	/**
	 * Load the modules.
	 * @param {ModuleManagerLoadFilterFunction} filter The filter function.
	 * @returns {this}
	 */
	public async loadModules(filter: ModuleManagerLoadFilterFunction = (_path: string) => true): Promise<this> {
		const filePaths = this.getModuleFilePaths();
		for await (const filePath of filePaths)
			if (filter(filePath)) await this.loadModule(filePath);

		return this;
	}

	/**
	 * Remove a module.
	 * @param {string | SnowyModule} modOrId The module or the id of the module.
	 * @returns {void}
	 */
	public remove(modOrId: string | SnowyModule, isReload = false): SnowyModule {
		const mod = isString(modOrId) ? this.modules.get(modOrId) : modOrId;
		if (mod === undefined) throw new SnowyError(ErrorTags.MODULE_NOT_FOUND, modOrId as string);
		this.deregister(mod);
		if (!isReload) this.emit('moduleDelete', mod);
		return mod;
	}

	/**
	 * Remove all modules.
	 * @returns {this} The manager.
	 */
	public removeAll(): this {
		for (const mod of this.modules.values())
			this.remove(mod);
		return this;
	}

	/**
	 * Register a module.
	 * @param {SnowyModule} mod The module to register.
	 * @returns {this}
	 */
	public register(mod: SnowyModule, isReload = false): this {
		this.modules.set(mod.id, mod);
		if (!isReload) this.emit('moduleCreate', mod);
		return this;
	}

	/**
	 * Deregister a module.
	 * @param {SnowyModule} mod module to be deregistered.
	 * @returns {void}
	 */
	public deregister(mod: SnowyModule): void {
		this.modules.delete(mod.id);
		if (mod.path !== null && Reflect.has(require.cache, mod.path)) Reflect.deleteProperty(require.cache, mod.path);
	}

	/**
	 * Reload a module.
	 * @param {string | SnowyModule} modOrId The module to reload.
	 * @returns {Promise<SnowyModule|undefined>} The reloaded module.
	 */
	public async reload(modOrId: string | SnowyModule): Promise<SnowyModule | undefined> {
		const mod = this.remove(modOrId, true);
		if (!mod.reloadable) return;
		if (!isString(mod.path)) throw new SnowyError(ErrorTags.MODULE_DOES_NOT_HAVE_A_PATH, mod.id);
		const newMod = await this.loadModule(mod.path, true);
		if (!newMod) return;
		this.emit('moduleReload', newMod);
		return newMod;
	}

	/**
	 * Reload all modules.
	 * @returns {Promise<this>}
	 */
	public async reloadAll(): Promise<this> {
		for await (const mod of this.modules.values())
			await this.reload(mod);

		return this;
	}
}

export interface ModuleManagerOptions {
	/**
	 * The path to the modules.
	 */
	path: string
	/**
	 * Whether to automate the categories of the modules.
	 */
	automateCategories?: boolean
}

export interface ModuleManager extends EventEmitter {
	on: <E extends keyof ModuleManagerEvents>(event: E, listener: ModuleManagerEvents[E]) => this
	once: <E extends keyof ModuleManagerEvents>(event: E, listener: ModuleManagerEvents[E]) => this
	emit: <E extends keyof ModuleManagerEvents>(event: E, ...args: Parameters<ModuleManagerEvents[E]>) => boolean
	removeAllListener: <E extends keyof ModuleManagerEvents>(event: E, listener: ModuleManagerEvents[E]) => this
	removeAllListeners: <E extends keyof ModuleManagerEvents>(event: E) => this
}

export interface ModuleManagerEvents {
	'moduleCreate': (module: SnowyModule) => void
	'moduleDelete': (module: SnowyModule) => void
	'moduleReload': (module: SnowyModule) => void
}

export type ExtendedSnowyModuleConstructor = new (context: SnowyContext, options: SnowyModuleOptions & { path: string }) => SnowyModule;

export type ModuleManagerLoadFilterFunction = (path: string) => boolean;
