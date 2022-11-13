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
	#modules: UniqueMap<string, ExtendedSnowyModule>;
	#options: ModuleManagerOptions;
	#context: SnowyContext;

	/**
	 *
	 * @param options The options of the manager.
	 */
	public constructor(client: Client, options: ModuleManagerOptions) {
		super();
		this.#modules = new UniqueMap<string, ExtendedSnowyModule>();
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
	public async loadModule(path: string): Promise<ExtendedSnowyModule | undefined> {
		const { default: mod }: { default: ExtendedSnowyModule } = await import(path);
		if (mod === undefined) return;
		// Create a new instance of the module.
		if (SnowyModule.isSnowyModuleConstructor(mod)) {
			// eslint-disable-next-line new-cap
			const instance = new mod(this.context, {
				path
			}) as ExtendedSnowyModule;

			instance.path = path;
			this.register(instance);
			return instance;
		}
	}

	/**
	 * Load the modules.
	 * @returns {this}
	 */
	public async loadModules(): Promise<this> {
		const filePaths = this.getModuleFilePaths();
		for await (const filePath of filePaths)
			await this.loadModule(filePath);

		return this;
	}

	/**
	 * Remove a module.
	 * @param modOrId The module or the id of the module.
	 * @returns {void}
	 */
	public remove(modOrId: string | ExtendedSnowyModule): void {
		const mod = isString(modOrId) ? this.modules.get(modOrId) : modOrId;
		if (mod === undefined) return;
		this.deregister(mod);
		this.emit('moduleDelete', mod);
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
	 * @param {ExtendedSnowyModule} mod The module to register.
	 * @returns {this}
	 */
	public register(mod: ExtendedSnowyModule): this {
		this.#modules.set(mod.id, mod);
		this.emit('moduleCreate', mod);
		return this;
	}

	/**
	 * Deregister a module.
	 * @param {ExtendedSnowyModule} mod module to be deregistered.
	 * @returns {this}
	 */
	public deregister(mod: ExtendedSnowyModule): void {
		this.#modules.delete(mod.id);
		if (mod.path !== null && Reflect.has(require.cache, mod.path)) Reflect.deleteProperty(require.cache, mod.path);
	}

	/**
	 * Reload a module.
	 * @param mod The module to reload.
	 * @returns {Promise<ExtendedSnowyModule>} The reloaded module.
	 */
	public async reload(modOrId: string | ExtendedSnowyModule): Promise<ExtendedSnowyModule | undefined> {
		const mod = isString(modOrId) ? this.modules.get(modOrId) : modOrId;
		if (mod === undefined) return;
		if (!isString(mod.path)) throw new SnowyError(ErrorTags.MODULE_DOES_NOT_HAVE_A_PATH, mod.id);
		this.deregister(mod);
		const newMod = await this.loadModule(mod.path);
		if (!newMod) return;
		this.emit('moduleReload', newMod);
		return newMod;
	}

	public async reloadAll(): Promise<this> {
		for await (const mod of this.modules.values())
			await this.reload(mod);

		return this;
	}

	/**
	 * @returns {UniqueMap<string, SnowyModule>} The modules of the bot.
	 */
	public get modules(): UniqueMap<string, ExtendedSnowyModule> { return this.#modules; }

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
	'moduleCreate': (module: ExtendedSnowyModule) => void
	'moduleDelete': (module: ExtendedSnowyModule) => void
	'moduleReload': (module: ExtendedSnowyModule) => void
}

export interface ExtendedSnowyModule extends SnowyModule {
	new(context: SnowyContext, options: SnowyModuleOptions & { path: string }): SnowyModule
};
