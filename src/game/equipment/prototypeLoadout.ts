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

const BLOCK_PLANKS: QuickEquipEntry = {
	id: 'block_planks',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Planks',
	textureId: TextureId.PLANKS,
	blockId: BlockId.PLANKS,
};

const BLOCK_GLASS: QuickEquipEntry = {
	id: 'block_glass',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Glass',
	textureId: TextureId.GLASS,
	blockId: BlockId.GLASS,
};

const BLOCK_LOG: QuickEquipEntry = {
	id: 'block_log',
	type: QuickEquipEntryType.BLOCK,
	displayName: 'Log',
	textureId: TextureId.LOG_SIDE,
	blockId: BlockId.LOG,
};

export type PrototypeLoadout = Readonly<Record<QuickEquipChannel, readonly QuickEquipEntry[]>>;

export const PROTOTYPE_LOADOUT: PrototypeLoadout = {
	[QuickEquipChannel.LEFT_HAND]: [],
	[QuickEquipChannel.RIGHT_HAND]: [
		BLOCK_GRASS,
		BLOCK_DIRT,
		BLOCK_STONE,
		BLOCK_PLANKS,
		BLOCK_GLASS,
		BLOCK_LOG,
	],
	[QuickEquipChannel.TOP]: [],
	[QuickEquipChannel.UTILITY]: [],
};
