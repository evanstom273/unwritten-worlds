import type { QuickEquipSnapshot } from '../game/equipment/QuickEquipManager';
import { QuickEquipChannel } from '../game/equipment/QuickEquipChannel';
import { QuickEquipEntryType } from '../game/equipment/QuickEquipEntry';
import { TextureId } from '../game/textures/TextureId';

const TEXTURE_CLASS: Partial<Record<TextureId, string>> = {
	[TextureId.GRASS_TOP]: 'equip-icon-grass',
	[TextureId.GRASS_SIDE]: 'equip-icon-grass-side',
	[TextureId.DIRT]: 'equip-icon-dirt',
	[TextureId.STONE]: 'equip-icon-stone',
	[TextureId.PLANKS]: 'equip-icon-planks',
	[TextureId.GLASS]: 'equip-icon-glass',
	[TextureId.LOG_TOP]: 'equip-icon-log-top',
	[TextureId.LOG_SIDE]: 'equip-icon-log',
};

interface EquipSlotIconProps {
	entry: QuickEquipSnapshot['channels'][QuickEquipChannel]['selectedEntry'];
	pulsing?: boolean;
	compact?: boolean;
}

export function EquipSlotIcon({ entry, pulsing = false, compact = false }: EquipSlotIconProps) {
	const isEmpty = entry.type === QuickEquipEntryType.EMPTY;
	const iconClass = entry.textureId !== undefined ? TEXTURE_CLASS[entry.textureId] : undefined;

	return (
		<span
			className={`equip-slot-icon${isEmpty ? ' equip-slot-icon-empty' : ''}${iconClass ? ` ${iconClass}` : ''}${pulsing ? ' equip-slot-icon-pulse' : ''}${compact ? ' equip-slot-icon-compact' : ''}`}
			title={isEmpty ? 'Empty' : entry.displayName}
			aria-hidden="true"
		>
			{isEmpty ? '·' : entry.displayName.charAt(0)}
		</span>
	);
}
