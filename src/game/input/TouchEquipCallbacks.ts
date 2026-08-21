import type { QuickEquipChannel } from '../equipment/QuickEquipChannel';

export interface TouchEquipCallbacks {
	onCycle: (channel: QuickEquipChannel) => void;
	onReset: (channel: QuickEquipChannel) => void;
}
