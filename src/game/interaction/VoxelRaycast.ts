import { isOpaqueBlock } from '../voxel/BlockId';
import type { World } from '../voxel/World';

export interface VoxelTarget {
	readonly hit: boolean;
	readonly blockX: number;
	readonly blockY: number;
	readonly blockZ: number;
	/** Last empty voxel traversed immediately before the solid hit — primary placement candidate. */
	readonly placeX: number;
	readonly placeY: number;
	readonly placeZ: number;
	readonly normalX: number;
	readonly normalY: number;
	readonly normalZ: number;
}

const NO_TARGET: VoxelTarget = {
	hit: false,
	blockX: 0,
	blockY: 0,
	blockZ: 0,
	placeX: 0,
	placeY: 0,
	placeZ: 0,
	normalX: 0,
	normalY: 0,
	normalZ: 0,
};

export function raycastVoxels(
	world: World,
	originX: number,
	originY: number,
	originZ: number,
	dirX: number,
	dirY: number,
	dirZ: number,
	maxDistance = 8,
): VoxelTarget {
	const length = Math.hypot(dirX, dirY, dirZ);
	if (length === 0) {
		return NO_TARGET;
	}

	const rayX = dirX / length;
	const rayY = dirY / length;
	const rayZ = dirZ / length;
	let currentX = Math.floor(originX);
	let currentY = Math.floor(originY);
	let currentZ = Math.floor(originZ);

	const stepX = rayX >= 0 ? 1 : -1;
	const stepY = rayY >= 0 ? 1 : -1;
	const stepZ = rayZ >= 0 ? 1 : -1;

	const tDeltaX = rayX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayX);
	const tDeltaY = rayY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayY);
	const tDeltaZ = rayZ === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayZ);

	let tMaxX = nextBoundaryT(originX, rayX, stepX);
	let tMaxY = nextBoundaryT(originY, rayY, stepY);
	let tMaxZ = nextBoundaryT(originZ, rayZ, stepZ);

	let previousX = currentX;
	let previousY = currentY;
	let previousZ = currentZ;

	for (let step = 0; step < 256; step++) {
		if (tMaxX < tMaxY) {
			if (tMaxX < tMaxZ) {
				if (tMaxX > maxDistance) {
					break;
				}
				previousX = currentX;
				currentX += stepX;
				tMaxX += tDeltaX;
			} else {
				if (tMaxZ > maxDistance) {
					break;
				}
				previousZ = currentZ;
				currentZ += stepZ;
				tMaxZ += tDeltaZ;
			}
		} else if (tMaxY < tMaxZ) {
			if (tMaxY > maxDistance) {
				break;
			}
			previousY = currentY;
			currentY += stepY;
			tMaxY += tDeltaY;
		} else {
			if (tMaxZ > maxDistance) {
				break;
			}
			previousZ = currentZ;
			currentZ += stepZ;
			tMaxZ += tDeltaZ;
		}

		if (!world.isInBounds(currentX, currentY, currentZ)) {
			break;
		}

		if (isOpaqueBlock(world.getBlock(currentX, currentY, currentZ))) {
			return {
				hit: true,
				blockX: currentX,
				blockY: currentY,
				blockZ: currentZ,
				placeX: previousX,
				placeY: previousY,
				placeZ: previousZ,
				normalX: previousX - currentX,
				normalY: previousY - currentY,
				normalZ: previousZ - currentZ,
			};
		}
	}

	return NO_TARGET;
}

function nextBoundaryT(origin: number, direction: number, step: number): number {
	if (direction === 0) {
		return Number.POSITIVE_INFINITY;
	}

	const nextBoundary = step > 0 ? Math.floor(origin) + 1 : Math.floor(origin);
	return (nextBoundary - origin) / direction;
}
