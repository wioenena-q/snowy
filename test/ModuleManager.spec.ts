import { join } from 'node:path';
import { ModuleManager } from '../src/ModuleManager';

const mngr = new ModuleManager({
	path: join(__dirname, 'modules')
});

console.log(mngr.getModuleFilePaths());
