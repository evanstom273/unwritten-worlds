import { isSolidBlock } from '../voxel/BlockId';
import type { World } from '../voxel/World';
import { blockFaceFromNormal, type BlockFace } from './BlockFace';

export interface VoxelTarget {
	readonly hit: boolean;
	readonly blockX: number;
	readonly blockY: number;
	readonly blockZ: number;
	readonly hitPositionX: number;
	readonly hitPositionY: number;
	readonly hitPositionZ: number;
	readonly normalX: number;
	readonly normalY: number;
	readonly normalZ: number;
	readonly face: BlockFace | null;
	readonly placeX: number;
	readonly placeY: number;
	readonly placeZ: number;
}

const NO_TARGET: VoxelTarget = {
	hit: false,
	blockX: 0,
	blockY: 0,
	blockZ: 0,
	hitPositionX: 0,
	hitPositionY: 0,
	hitPositionZ: 0,
	normalX: 0,
	normalY: 0,
	normalZ: 0,
	face: null,
	placeX: 0,
	placeY: 0,
	placeZ: 0,
};

type CrossedAxis = 'x' | 'y' | 'z';

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

	for (let step = 0; step < 256; step++) {
		let crossedAxis: CrossedAxis;
		let hitT: number;

		if (tMaxX < tMaxY) {
			if (tMaxX < tMaxZ) {
				hitT = tMaxX;
				if (hitT > maxDistance) {
					break;
				}
				crossedAxis = 'x';
				currentX += stepX;
				tMaxX += tDeltaX;
			} else {
				hitT = tMaxZ;
				if (hitT > maxDistance) {
					break;
				}
				crossedAxis = 'z';
				currentZ += stepZ;
				tMaxZ += tDeltaZ;
			}
		} else if (tMaxY < tMaxZ) {
			hitT = tMaxY;
			if (hitT > maxDistance) {
				break;
			}
			crossedAxis = 'y';
			currentY += stepY;
			tMaxY += tDeltaY;
		} else {
			hitT = tMaxZ;
			if (hitT > maxDistance) {
				break;
			}
			crossedAxis = 'z';
			currentZ += stepZ;
			tMaxZ += tDeltaZ;
		}

		if (!world.isInBounds(currentX, currentY, currentZ)) {
			break;
		}

		if (!isSolidBlock(world.getBlock(currentX, currentY, currentZ))) {
			continue;
		}

		const normalX = crossedAxis === 'x' ? -stepX : 0;
		const normalY = crossedAxis === 'y' ? -stepY : 0;
		const normalZ = crossedAxis === 'z' ? -stepZ : 0;

		return {
			hit: true,
			blockX: currentX,
			blockY: currentY,
			blockZ: currentZ,
			hitPositionX: originX + rayX * hitT,
			hitPositionY: originY + rayY * hitT,
			hitPositionZ: originZ + rayZ * hitT,
			normalX,
			normalY,
			normalZ,
			face: blockFaceFromNormal(normalX, normalY, normalZ),
			placeX: currentX + normalX,
			placeY: currentY + normalY,
			placeZ: currentZ + normalZ,
		};
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
