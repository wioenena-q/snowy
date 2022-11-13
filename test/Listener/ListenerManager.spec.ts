import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { Client } from '../../src/Client';
import { ListenerManager } from '../../src/Listener/ListenerManager';

jest.setTimeout(1000 * 60);

const client = new Client({
	clientOptions: {
		intents: 0
	}
});

const listenerManager = new ListenerManager(client, {
	path: join(__dirname, 'listeners')
});

const ee = new EventEmitter();

listenerManager.addEmitter('ee', ee);

beforeEach(async () => {
	await listenerManager.loadModules();
});

afterEach(() => {
	listenerManager.removeAll();
});

describe('ListenerManager', () => {
	test('trigger after 1 second', (done) => {
		expect(ee.listeners('ready').length).toBe(1);
		setTimeout(() => {
			ee.emit('ready', done);
		}, 1000);
	});

	test('remove listener from listener manager and remove listener from emitter\'s listeners', () => {
		expect(ee.listeners('ready').length).toBe(1);
		listenerManager.remove('Ready');
		expect(ee.listeners('ready').length).toBe(0);
	});
});

describe('Listener', () => {
	test('.remove()', () => {
		const listener = listenerManager.modules.get('Ready');
		if (!listener) throw new Error('Listener not found');
		expect(ee.listeners('ready').length).toBe(1);
		listener.remove();
		expect(ee.listeners('ready').length).toBe(0);
	});
});
