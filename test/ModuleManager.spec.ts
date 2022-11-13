import { describe, expect, test } from '@jest/globals';
import { join } from 'node:path';
import { Client } from '../src/Client';
import { ModuleManager } from '../src/ModuleManager';

const client = new Client({
	clientOptions: {
		intents: 0
	}
});

const manager = new ModuleManager(client, {
	path: join(__dirname, 'modules')
});

describe('ModuleManager', () => {
	test('module manager successfully read module directory', () => {
		expect(manager.getModuleFilePaths().length).toBeGreaterThan(0);
	});

	test('module manager\'s loadModules method returns the manager successfully', async () => {
		await manager.loadModules();
		expect(manager.modules.size).toBeGreaterThan(0);
	});

	test('module manager remove all modules successfully', async () => {
		manager.removeAll();
		expect(manager.modules.size).toBe(0);
	});
});

describe('SnowyModule', () => {
	test('reload a module', async () => {
		await manager.loadModules();
		const mod = manager.modules.values().next().value;
		if (mod === undefined) throw new Error('Module not found');
		mod.reload();
	});

	test('remove a module', () => {
		const mod = manager.modules.values().next().value;
		if (mod === undefined) throw new Error('Module not found');
		expect(manager.modules.size).toBe(1);
		mod.remove();
		expect(manager.modules.size).toBe(0);
	});
});
