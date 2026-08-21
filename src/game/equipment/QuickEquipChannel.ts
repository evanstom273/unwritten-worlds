export const QuickEquipChannel = {
	LEFT_HAND: 'left_hand',
	RIGHT_HAND: 'right_hand',
	TOP: 'top',
	UTILITY: 'utility',
} as const;

export type QuickEquipChannel = (typeof QuickEquipChannel)[keyof typeof QuickEquipChannel];

export const QUICK_EQUIP_CHANNELS: readonly QuickEquipChannel[] = [
	QuickEquipChannel.TOP,
	QuickEquipChannel.LEFT_HAND,
	QuickEquipChannel.RIGHT_HAND,
	QuickEquipChannel.UTILITY,
];
