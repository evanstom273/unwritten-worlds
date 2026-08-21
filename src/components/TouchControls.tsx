import type { QuickEquipSnapshot } from '../game/equipment/QuickEquipManager';
import { QuickEquipChannel } from '../game/equipment/QuickEquipChannel';
import { EquipSlotIcon } from './EquipSlotIcon';

interface TouchControlsProps {
	snapshot: QuickEquipSnapshot;
}

export function TouchControls({ snapshot }: TouchControlsProps) {
	const pulseChannel = snapshot.lastChangedChannel;
	const pulseActive = performance.now() - snapshot.lastChangedAtMs < 400;

	const isPulsing = (channel: QuickEquipChannel): boolean =>
		pulseActive && pulseChannel === channel;

	return (
		<div className="touch-controls">
			<div className="touch-move-cluster">
				<button
					type="button"
					className="touch-equip-slot touch-equip-top"
					data-touch="equip-top"
					aria-label="Cycle top equipment"
				>
					<EquipSlotIcon
						entry={snapshot.channels[QuickEquipChannel.TOP].selectedEntry}
						pulsing={isPulsing(QuickEquipChannel.TOP)}
						compact
					/>
				</button>
				<button
					type="button"
					className="touch-equip-slot touch-equip-left"
					data-touch="equip-left"
					aria-label="Cycle left hand equipment"
				>
					<EquipSlotIcon
						entry={snapshot.channels[QuickEquipChannel.LEFT_HAND].selectedEntry}
						pulsing={isPulsing(QuickEquipChannel.LEFT_HAND)}
						compact
					/>
				</button>
				<div className="touch-joystick" data-touch="joystick">
					<div className="touch-joystick-stick" data-touch="joystick-stick" />
				</div>
				<button
					type="button"
					className="touch-equip-slot touch-equip-right"
					data-touch="equip-right"
					aria-label="Cycle right hand equipment"
				>
					<EquipSlotIcon
						entry={snapshot.channels[QuickEquipChannel.RIGHT_HAND].selectedEntry}
						pulsing={isPulsing(QuickEquipChannel.RIGHT_HAND)}
						compact
					/>
				</button>
				<button
					type="button"
					className="touch-equip-slot touch-equip-utility"
					data-touch="equip-utility"
					aria-label="Cycle utility equipment"
				>
					<EquipSlotIcon
						entry={snapshot.channels[QuickEquipChannel.UTILITY].selectedEntry}
						pulsing={isPulsing(QuickEquipChannel.UTILITY)}
						compact
					/>
				</button>
			</div>
			<div className="touch-look" data-touch="look" aria-hidden="true" />
			<div className="touch-actions">
				<button type="button" className="touch-btn touch-btn-jump" data-touch="jump">
					Jump
				</button>
				<button type="button" className="touch-btn touch-btn-sprint" data-touch="sprint">
					Sprint
				</button>
				<button type="button" className="touch-btn touch-btn-crouch" data-touch="crouch">
					Crouch
				</button>
			</div>
		</div>
	);
}
