import { EventEmitter } from 'node:events';
import { readdirSync, type Dirent } from 'node:fs';
import { join } from 'node:path';
import type { SnowyModule } from './SnowyModule';
import { UniqueMap } from './UniqueMap';

/**
 * @classdesc The manager class for the bot.
 * @extends {EventEmitter}
 */
export class ModuleManager extends EventEmitter {
	#modules: UniqueMap<string, SnowyModule>;
	#options: ModuleManagerOptions;

	public constructor(options: ModuleManagerOptions) {
		super();
		this.#modules = new UniqueMap<string, SnowyModule>();
		this.#options = options;
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
	 * @returns {UniqueMap<string, SnowyModule>} The modules of the bot.
	 */
	public get modules(): UniqueMap<string, SnowyModule> { return this.#modules; }

	/**
	 * @returns {ModuleManagerOptions} The options of the manager.
	 */
	public get options(): ModuleManagerOptions { return this.#options; }
}

export interface ModuleManagerOptions {
	path: string // The path to the modules.
}
