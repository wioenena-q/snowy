import { describe, expect, test } from '@jest/globals';
import { join } from 'node:path';
import { ModuleManager } from '../src/ModuleManager';

const manager = new ModuleManager({
	path: join(__dirname, 'modules')
});

describe('ModuleManager', () => {
	test('module manager successfully read module directory', () => {
		expect(manager.getModuleFilePaths().length).toBeGreaterThan(0);
	});
});
