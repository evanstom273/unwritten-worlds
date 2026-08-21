import { WORLD_DEPTH, WORLD_WIDTH } from '../voxel/WorldConstants';
import type { World } from '../voxel/World';

export interface SpawnPosition {
	x: number;
	y: number;
	z: number;
}

export function findSpawnPosition(world: World): SpawnPosition {
	const x = WORLD_WIDTH / 2;
	const z = WORLD_DEPTH / 2;
	return findSurfaceSpawn(world, x, z);
}

export function findSurfaceSpawn(world: World, worldX: number, worldZ: number): SpawnPosition {
	const surfaceBlockY = world.findHighestSolidBlock(worldX, worldZ);

	if (surfaceBlockY === null) {
		return { x: worldX, y: 65, z: worldZ };
	}

	return {
		x: worldX,
		y: surfaceBlockY + 1,
		z: worldZ,
	};
}
