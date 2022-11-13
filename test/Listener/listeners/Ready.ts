import { Listener, ListenerOptions } from '../../../src/Listener/Listener';
import type { SnowyContext } from '../../../src/SnowyContext';

export default class Ready extends Listener {
	public constructor(context: SnowyContext, _: ListenerOptions) {
		super(context, 'Ready', {
			emitter: 'ee',
			event: 'ready',
			type: 'on'
		});
	}

	public exec(done: Function): void {
		console.log('I\'m ready!');
		done();
	}
}
