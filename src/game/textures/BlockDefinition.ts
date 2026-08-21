import { BlockId } from '../voxel/BlockId';
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
]);

export function getBlockDefinition(blockId: BlockId): BlockDefinition | undefined {
	return BLOCK_DEFINITIONS.get(blockId);
}

export function getBlockFaceTexture(blockId: BlockId, face: BlockFace): TextureId | undefined {
	const definition = getBlockDefinition(blockId);
	return definition?.textures[face];
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
