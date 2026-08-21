export const TextureId = {
	GRASS_TOP: 0,
	GRASS_SIDE: 1,
	DIRT: 2,
	STONE: 3,
} as const;

export type TextureId = (typeof TextureId)[keyof typeof TextureId];

export interface AtlasTile {
	readonly u0: number;
	readonly v0: number;
	readonly u1: number;
	readonly v1: number;
}

export interface TextureAtlasLayout {
	readonly atlasWidth: number;
	readonly atlasHeight: number;
	readonly tileSize: number;
	readonly tiles: ReadonlyMap<TextureId, AtlasTile>;
}

export const TEXTURE_TILE_SIZE = 16;
export const TEXTURE_ATLAS_WIDTH = 64;
export const TEXTURE_ATLAS_HEIGHT = 64;

const TILE_INSET = 0.5 / TEXTURE_ATLAS_WIDTH;

function tileUV(tileX: number, tileY: number): AtlasTile {
	const tileSize = TEXTURE_TILE_SIZE;
	const u0 = tileX * tileSize / TEXTURE_ATLAS_WIDTH + TILE_INSET;
	const v0 = tileY * tileSize / TEXTURE_ATLAS_HEIGHT + TILE_INSET;
	const u1 = (tileX + 1) * tileSize / TEXTURE_ATLAS_WIDTH - TILE_INSET;
	const v1 = (tileY + 1) * tileSize / TEXTURE_ATLAS_HEIGHT - TILE_INSET;
	return { u0, v0, u1, v1 };
}

export const TEXTURE_ATLAS_LAYOUT: TextureAtlasLayout = {
	atlasWidth: TEXTURE_ATLAS_WIDTH,
	atlasHeight: TEXTURE_ATLAS_HEIGHT,
	tileSize: TEXTURE_TILE_SIZE,
	tiles: new Map([
		[TextureId.GRASS_TOP, tileUV(0, 0)],
		[TextureId.GRASS_SIDE, tileUV(1, 0)],
		[TextureId.DIRT, tileUV(0, 1)],
		[TextureId.STONE, tileUV(1, 1)],
	]),
};

export function getAtlasTile(textureId: TextureId): AtlasTile {
	const tile = TEXTURE_ATLAS_LAYOUT.tiles.get(textureId);
	if (!tile) {
		throw new Error(`Missing atlas tile for texture ${textureId}`);
	}
	return tile;
}
