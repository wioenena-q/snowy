import { EventEmitter } from 'node:events';
import { readdirSync, type Dirent } from 'node:fs';
import { join } from 'node:path';
import type { Client } from './Client';
import { SnowyContext } from './SnowyContext';
import { ErrorTags, SnowyError } from './SnowyError';
import { SnowyModule, SnowyModuleOptions } from './SnowyModule';
import { UniqueMap } from './UniqueMap';
import { isString } from './Utils';

/**
 * @classdesc The manager class for the bot.
 * @extends {EventEmitter}
 */
export class ModuleManager extends EventEmitter {
	#modules: UniqueMap<string, SnowyModule>;
	#options: ModuleManagerOptions;
	#context: SnowyContext;

	/**
	 *
	 * @param options The options of the manager.
	 */
	public constructor(client: Client, options: ModuleManagerOptions) {
		super();
		this.#modules = new UniqueMap();
		this.#options = options;
		this.#context = new SnowyContext(client, this);
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
		})(this.#options.path);

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

			instance.path = path;
			this.register(instance, isReload);
			return instance;
		}
	}

	/**
	 * Load the modules.
	 * @returns {this}
	 */
	public async loadModules(filter = (path: string) => true): Promise<this> {
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
		this.#modules.set(mod.id, mod);
		if (!isReload) this.emit('moduleCreate', mod);
		return this;
	}

	/**
	 * Deregister a module.
	 * @param {SnowyModule} mod module to be deregistered.
	 * @returns {void}
	 */
	public deregister(mod: SnowyModule): void {
		this.#modules.delete(mod.id);
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

	/**
	 * @returns {UniqueMap<string, SnowyModule>} The modules of the bot.
	 */
	public get modules(): UniqueMap<string, SnowyModule> { return this.#modules; }

	/**
	 * @returns {ModuleManagerOptions} The options of the manager.
	 */
	public get options(): ModuleManagerOptions { return this.#options; }

	/**
	 * @returns {SnowyContext} The context of the manager.
	 */
	public get context(): SnowyContext { return this.#context; }
}

export interface ModuleManagerOptions {
	path: string // The path to the modules.
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
