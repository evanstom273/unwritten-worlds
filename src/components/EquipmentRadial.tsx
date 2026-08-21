import { QuickEquipChannel } from '../game/equipment/QuickEquipChannel';

interface EquipmentRadialProps {
	open: boolean;
	onSelectChannel: (channel: QuickEquipChannel) => void;
	onClose: () => void;
}

export function EquipmentRadial({ open, onSelectChannel, onClose }: EquipmentRadialProps) {
	if (!open) {
		return null;
	}

	return (
		<div className="equip-radial-backdrop" onClick={onClose}>
			<div className="equip-radial" onClick={(event) => event.stopPropagation()}>
				<button
					type="button"
					className="equip-radial-option equip-radial-top"
					onClick={() => onSelectChannel(QuickEquipChannel.TOP)}
				>
					Top
				</button>
				<button
					type="button"
					className="equip-radial-option equip-radial-left"
					onClick={() => onSelectChannel(QuickEquipChannel.LEFT_HAND)}
				>
					Left
				</button>
				<button
					type="button"
					className="equip-radial-option equip-radial-right"
					onClick={() => onSelectChannel(QuickEquipChannel.RIGHT_HAND)}
				>
					Right
				</button>
				<button
					type="button"
					className="equip-radial-option equip-radial-utility"
					onClick={() => onSelectChannel(QuickEquipChannel.UTILITY)}
				>
					Utility
				</button>
				<div className="equip-radial-center">Cycle</div>
			</div>
		</div>
	);
}
