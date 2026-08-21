import type { QuickEquipSnapshot } from '../game/equipment/QuickEquipManager';
import { QuickEquipChannel } from '../game/equipment/QuickEquipChannel';
import { QuickEquipEntryType } from '../game/equipment/QuickEquipEntry';
import { TextureId } from '../game/textures/TextureId';

interface QuickEquipHudProps {
	snapshot: QuickEquipSnapshot;
	showRadialHints?: boolean;
}

const TEXTURE_CLASS: Partial<Record<TextureId, string>> = {
	[TextureId.GRASS_TOP]: 'equip-icon-grass',
	[TextureId.GRASS_SIDE]: 'equip-icon-grass-side',
	[TextureId.DIRT]: 'equip-icon-dirt',
	[TextureId.STONE]: 'equip-icon-stone',
};

function EquipSlot({
	label,
	entry,
	pulsing,
}: {
	label: string;
	entry: QuickEquipSnapshot['channels'][QuickEquipChannel]['selectedEntry'];
	pulsing: boolean;
}) {
	const isEmpty = entry.type === QuickEquipEntryType.EMPTY;
	const iconClass = entry.textureId !== undefined ? TEXTURE_CLASS[entry.textureId] : undefined;

	return (
		<div className={`equip-slot equip-slot-${label.toLowerCase()}${pulsing ? ' equip-slot-pulse' : ''}`}>
			<span className="equip-slot-label">{label}</span>
			<div
				className={`equip-slot-icon${isEmpty ? ' equip-slot-icon-empty' : ''}${iconClass ? ` ${iconClass}` : ''}`}
				title={entry.displayName}
			>
				{isEmpty ? '—' : entry.displayName.charAt(0)}
			</div>
			<span className="equip-slot-name">{isEmpty ? 'Empty' : entry.displayName}</span>
		</div>
	);
}

export function QuickEquipHud({ snapshot, showRadialHints = false }: QuickEquipHudProps) {
	const pulseChannel = snapshot.lastChangedChannel;
	const pulseActive = performance.now() - snapshot.lastChangedAtMs < 400;

	return (
		<div className="quick-equip-hud">
			<EquipSlot
				label="Top"
				entry={snapshot.channels[QuickEquipChannel.TOP].selectedEntry}
				pulsing={pulseActive && pulseChannel === QuickEquipChannel.TOP}
			/>
			<div className="quick-equip-row">
				<EquipSlot
					label="L"
					entry={snapshot.channels[QuickEquipChannel.LEFT_HAND].selectedEntry}
					pulsing={pulseActive && pulseChannel === QuickEquipChannel.LEFT_HAND}
				/>
				<div className="quick-equip-center" aria-hidden="true">
					{showRadialHints ? 'Equip' : ''}
				</div>
				<EquipSlot
					label="R"
					entry={snapshot.channels[QuickEquipChannel.RIGHT_HAND].selectedEntry}
					pulsing={pulseActive && pulseChannel === QuickEquipChannel.RIGHT_HAND}
				/>
			</div>
			<EquipSlot
				label="Util"
				entry={snapshot.channels[QuickEquipChannel.UTILITY].selectedEntry}
				pulsing={pulseActive && pulseChannel === QuickEquipChannel.UTILITY}
			/>
		</div>
	);
}
