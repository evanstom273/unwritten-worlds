import * as THREE from 'three';
import {
	DIRT_PIXELS,
	GLASS_PIXELS,
	GRASS_SIDE_PIXELS,
	GRASS_TOP_PIXELS,
	LOG_SIDE_PIXELS,
	LOG_TOP_PIXELS,
	PLANKS_PIXELS,
	STONE_PIXELS,
} from '../../assets/textures/blocks/blockPixels';
import {
	TEXTURE_ATLAS_HEIGHT,
	TEXTURE_ATLAS_WIDTH,
	TEXTURE_TILE_SIZE,
} from './TextureId';

function blitTile(
	atlasData: Uint8Array,
	atlasWidth: number,
	tileX: number,
	tileY: number,
	tilePixels: Uint8Array,
): void {
	const tileSize = TEXTURE_TILE_SIZE;
	for (let y = 0; y < tileSize; y++) {
		for (let x = 0; x < tileSize; x++) {
			const src = (y * tileSize + x) * 4;
			const dstX = tileX * tileSize + x;
			const dstY = tileY * tileSize + y;
			const dst = (dstY * atlasWidth + dstX) * 4;
			atlasData[dst] = tilePixels[src];
			atlasData[dst + 1] = tilePixels[src + 1];
			atlasData[dst + 2] = tilePixels[src + 2];
			atlasData[dst + 3] = tilePixels[src + 3];
		}
	}
}

export function createTerrainAtlasTexture(): THREE.Texture {
	const atlasData = new Uint8Array(TEXTURE_ATLAS_WIDTH * TEXTURE_ATLAS_HEIGHT * 4);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 0, 0, GRASS_TOP_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 1, 0, GRASS_SIDE_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 0, 1, DIRT_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 1, 1, STONE_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 2, 0, PLANKS_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 3, 0, GLASS_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 2, 1, LOG_TOP_PIXELS);
	blitTile(atlasData, TEXTURE_ATLAS_WIDTH, 3, 1, LOG_SIDE_PIXELS);

	const texture = new THREE.DataTexture(
		atlasData,
		TEXTURE_ATLAS_WIDTH,
		TEXTURE_ATLAS_HEIGHT,
		THREE.RGBAFormat,
	);
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.needsUpdate = true;

	return texture;
}

export function createSharedTerrainMaterial(
	atlasTexture: THREE.Texture,
): THREE.MeshLambertMaterial {
	return new THREE.MeshLambertMaterial({
		map: atlasTexture,
		transparent: true,
		alphaTest: 0.1,
	});
}
