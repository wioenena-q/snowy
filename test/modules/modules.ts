import type { SnowyContext } from '../../src/SnowyContext';
import { SnowyModule, SnowyModuleOptions } from '../../src/SnowyModule';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ClearCommand extends SnowyModule {
	public constructor(context: SnowyContext, options: SnowyModuleOptions) {
		super(context, 'clear', {
			...options,
			reloadable: false
		});
	}
}

export default ClearCommand;
