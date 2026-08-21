import { BlockId } from '../voxel/BlockId';
import { LogAxis, type BlockState } from '../voxel/BlockState';
import { TextureId } from './TextureId';

export type BlockFace = 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west';

export interface BlockFaceTextures {
	readonly top: TextureId;
	readonly bottom: TextureId;
	readonly north: TextureId;
	readonly south: TextureId;
	readonly east: TextureId;
	readonly west: TextureId;
}

export interface BlockDefinition {
	readonly opaque: boolean;
	readonly textures: BlockFaceTextures;
}

const BLOCK_DEFINITIONS: ReadonlyMap<BlockId, BlockDefinition> = new Map([
	[
		BlockId.GRASS,
		{
			opaque: true,
			textures: {
				top: TextureId.GRASS_TOP,
				bottom: TextureId.DIRT,
				north: TextureId.GRASS_SIDE,
				south: TextureId.GRASS_SIDE,
				east: TextureId.GRASS_SIDE,
				west: TextureId.GRASS_SIDE,
			},
		},
	],
	[
		BlockId.DIRT,
		{
			opaque: true,
			textures: {
				top: TextureId.DIRT,
				bottom: TextureId.DIRT,
				north: TextureId.DIRT,
				south: TextureId.DIRT,
				east: TextureId.DIRT,
				west: TextureId.DIRT,
			},
		},
	],
	[
		BlockId.STONE,
		{
			opaque: true,
			textures: {
				top: TextureId.STONE,
				bottom: TextureId.STONE,
				north: TextureId.STONE,
				south: TextureId.STONE,
				east: TextureId.STONE,
				west: TextureId.STONE,
			},
		},
	],
	[
		BlockId.PLANKS,
		{
			opaque: true,
			textures: {
				top: TextureId.PLANKS,
				bottom: TextureId.PLANKS,
				north: TextureId.PLANKS,
				south: TextureId.PLANKS,
				east: TextureId.PLANKS,
				west: TextureId.PLANKS,
			},
		},
	],
	[
		BlockId.GLASS,
		{
			opaque: false,
			textures: {
				top: TextureId.GLASS,
				bottom: TextureId.GLASS,
				north: TextureId.GLASS,
				south: TextureId.GLASS,
				east: TextureId.GLASS,
				west: TextureId.GLASS,
			},
		},
	],
	[
		BlockId.LOG,
		{
			opaque: true,
			textures: {
				top: TextureId.LOG_TOP,
				bottom: TextureId.LOG_TOP,
				north: TextureId.LOG_SIDE,
				south: TextureId.LOG_SIDE,
				east: TextureId.LOG_SIDE,
				west: TextureId.LOG_SIDE,
			},
		},
	],
]);

export function getBlockDefinition(blockId: BlockId): BlockDefinition | undefined {
	return BLOCK_DEFINITIONS.get(blockId);
}

export function getBlockFaceTexture(
	blockId: BlockId,
	face: BlockFace,
	blockState: BlockState = 0,
): TextureId | undefined {
	if (blockId === BlockId.LOG) {
		return getLogFaceTexture(blockState, face);
	}

	const definition = getBlockDefinition(blockId);
	return definition?.textures[face];
}

function getLogFaceTexture(blockState: BlockState, face: BlockFace): TextureId {
	const axis = blockState === LogAxis.X || blockState === LogAxis.Z ? blockState : LogAxis.Y;

	if (axis === LogAxis.Y) {
		return face === 'top' || face === 'bottom' ? TextureId.LOG_TOP : TextureId.LOG_SIDE;
	}
	if (axis === LogAxis.X) {
		return face === 'east' || face === 'west' ? TextureId.LOG_TOP : TextureId.LOG_SIDE;
	}
	return face === 'north' || face === 'south' ? TextureId.LOG_TOP : TextureId.LOG_SIDE;
}

export function faceFromDirection(dx: number, dy: number, dz: number): BlockFace {
	if (dy === 1) {
		return 'top';
	}
	if (dy === -1) {
		return 'bottom';
	}
	if (dz === 1) {
		return 'south';
	}
	if (dz === -1) {
		return 'north';
	}
	if (dx === 1) {
		return 'east';
	}
	return 'west';
}
