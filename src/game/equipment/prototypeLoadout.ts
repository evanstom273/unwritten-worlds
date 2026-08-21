import { TextureId } from '../textures/TextureId';
import { BlockId } from '../voxel/BlockId';
import { QuickEquipChannel } from './QuickEquipChannel';
import { QuickEquipEntryType, type QuickEquipEntry } from './QuickEquipEntry';

const BLOCK_GRASS: QuickEquipEntry = {
	id: 'block_grass',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Grass',
	textureId: TextureId.GRASS_TOP,
	blockId: BlockId.GRASS,
};

const BLOCK_DIRT: QuickEquipEntry = {
	id: 'block_dirt',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Dirt',
	textureId: TextureId.DIRT,
	blockId: BlockId.DIRT,
};

const BLOCK_STONE: QuickEquipEntry = {
	id: 'block_stone',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Stone',
	textureId: TextureId.STONE,
	blockId: BlockId.STONE,
};

export type PrototypeLoadout = Readonly<Record<QuickEquipChannel, readonly QuickEquipEntry[]>>;

export const PROTOTYPE_LOADOUT: PrototypeLoadout = {
	[QuickEquipChannel.LEFT_HAND]: [],
	[QuickEquipChannel.RIGHT_HAND]: [BLOCK_GRASS, BLOCK_DIRT, BLOCK_STONE],
	[QuickEquipChannel.TOP]: [],
	[QuickEquipChannel.UTILITY]: [],
};
