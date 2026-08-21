import type { QuickEquipSnapshot } from '../game/equipment/QuickEquipManager';
import { QuickEquipChannel } from '../game/equipment/QuickEquipChannel';
import { EquipSlotIcon } from './EquipSlotIcon';

interface QuickEquipHudProps {
	snapshot: QuickEquipSnapshot;
}

export function QuickEquipHud({ snapshot }: QuickEquipHudProps) {
	const pulseChannel = snapshot.lastChangedChannel;
	const pulseActive = performance.now() - snapshot.lastChangedAtMs < 400;

	const isPulsing = (channel: QuickEquipChannel): boolean =>
		pulseActive && pulseChannel === channel;

	return (
		<div className="quick-equip-hud">
			<div className={`equip-slot equip-slot-top${isPulsing(QuickEquipChannel.TOP) ? ' equip-slot-pulse' : ''}`}>
				<span className="equip-slot-label">Top</span>
				<EquipSlotIcon entry={snapshot.channels[QuickEquipChannel.TOP].selectedEntry} />
			</div>
			<div className="quick-equip-row">
				<div className={`equip-slot equip-slot-left${isPulsing(QuickEquipChannel.LEFT_HAND) ? ' equip-slot-pulse' : ''}`}>
					<span className="equip-slot-label">L</span>
					<EquipSlotIcon entry={snapshot.channels[QuickEquipChannel.LEFT_HAND].selectedEntry} />
				</div>
				<div className="quick-equip-center" aria-hidden="true" />
				<div className={`equip-slot equip-slot-right${isPulsing(QuickEquipChannel.RIGHT_HAND) ? ' equip-slot-pulse' : ''}`}>
					<span className="equip-slot-label">R</span>
					<EquipSlotIcon entry={snapshot.channels[QuickEquipChannel.RIGHT_HAND].selectedEntry} />
				</div>
			</div>
			<div className={`equip-slot equip-slot-util${isPulsing(QuickEquipChannel.UTILITY) ? ' equip-slot-pulse' : ''}`}>
				<span className="equip-slot-label">Util</span>
				<EquipSlotIcon entry={snapshot.channels[QuickEquipChannel.UTILITY].selectedEntry} />
			</div>
		</div>
	);
}
