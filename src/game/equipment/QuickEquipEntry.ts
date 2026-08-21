import type { BlockId } from '../voxel/BlockId';
import type { TextureId } from '../textures/TextureId';

export const QuickEquipEntryType = {
	BLOCK: 'block',
	EMPTY: 'empty',
} as const;

export type QuickEquipEntryType = (typeof QuickEquipEntryType)[keyof typeof QuickEquipEntryType];

export interface QuickEquipEntry {
	readonly id: string;
	readonly type: QuickEquipEntryType;
	readonly displayName: string;
	readonly textureId?: TextureId;
	readonly blockId?: BlockId;
}

export const EMPTY_QUICK_EQUIP_ENTRY: QuickEquipEntry = {
	id: 'empty',
	type: QuickEquipEntryType.EMPTY,
	displayName: 'Empty',
};
