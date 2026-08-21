import { PLAYER_HALF_WIDTH, PLAYER_HEIGHT } from '../config/PlayerConfig';
import type { World } from '../voxel/World';

export interface AABB {
	minX: number;
	minY: number;
	minZ: number;
	maxX: number;
	maxY: number;
	maxZ: number;
}

export interface CollisionResult {
	positionX: number;
	positionY: number;
	positionZ: number;
	velocityX: number;
	velocityY: number;
	velocityZ: number;
	grounded: boolean;
}

const SKIN_WIDTH = 0.001;

export function buildPlayerAABB(
	feetX: number,
	feetY: number,
	feetZ: number,
	height: number = PLAYER_HEIGHT,
): AABB {
	return {
		minX: feetX - PLAYER_HALF_WIDTH,
		maxX: feetX + PLAYER_HALF_WIDTH,
		minY: feetY,
		maxY: feetY + height,
		minZ: feetZ - PLAYER_HALF_WIDTH,
		maxZ: feetZ + PLAYER_HALF_WIDTH,
	};
}

export function resolveMovement(
	world: World,
	feetX: number,
	feetY: number,
	feetZ: number,
	velocityX: number,
	velocityY: number,
	velocityZ: number,
	delta: number,
	playerHeight: number = PLAYER_HEIGHT,
): CollisionResult {
	let x = feetX;
	let y = feetY;
	let z = feetZ;
	let vx = velocityX;
	let vy = velocityY;
	let vz = velocityZ;
	let grounded = false;

	if (vx !== 0) {
		const resolved = resolveAxis(world, x, y, z, vx * delta, 'x', playerHeight);
		x = resolved.position;
		if (resolved.hit) {
			vx = 0;
		}
	}

	if (vy !== 0) {
		const resolved = resolveAxis(world, x, y, z, vy * delta, 'y', playerHeight);
		y = resolved.position;
		if (resolved.hit) {
			if (vy < 0) {
				grounded = true;
			}
			vy = 0;
		}
	}

	if (vz !== 0) {
		const resolved = resolveAxis(world, x, y, z, vz * delta, 'z', playerHeight);
		z = resolved.position;
		if (resolved.hit) {
			vz = 0;
		}
	}

	if (!grounded) {
		grounded = probeGround(world, x, y, z, playerHeight);
	}

	return {
		positionX: x,
		positionY: y,
		positionZ: z,
		velocityX: vx,
		velocityY: vy,
		velocityZ: vz,
		grounded,
	};
}

type Axis = 'x' | 'y' | 'z';

function resolveAxis(
	world: World,
	feetX: number,
	feetY: number,
	feetZ: number,
	movement: number,
	axis: Axis,
	playerHeight: number,
): { position: number; hit: boolean } {
	if (movement === 0) {
		return { position: axis === 'x' ? feetX : axis === 'y' ? feetY : feetZ, hit: false };
	}

	let position = axis === 'x' ? feetX : axis === 'y' ? feetY : feetZ;
	position += movement;

	const aabb = buildPlayerAABB(
		axis === 'x' ? position : feetX,
		axis === 'y' ? position : feetY,
		axis === 'z' ? position : feetZ,
		playerHeight,
	);

	const minBlockX = Math.floor(aabb.minX + SKIN_WIDTH);
	const maxBlockX = Math.floor(aabb.maxX - SKIN_WIDTH);
	const minBlockY = Math.floor(aabb.minY + SKIN_WIDTH);
	const maxBlockY = Math.floor(aabb.maxY - SKIN_WIDTH);
	const minBlockZ = Math.floor(aabb.minZ + SKIN_WIDTH);
	const maxBlockZ = Math.floor(aabb.maxZ - SKIN_WIDTH);

	let hit = false;

	for (let blockY = minBlockY; blockY <= maxBlockY; blockY++) {
		for (let blockZ = minBlockZ; blockZ <= maxBlockZ; blockZ++) {
			for (let blockX = minBlockX; blockX <= maxBlockX; blockX++) {
				if (!world.isBlockSolid(blockX, blockY, blockZ)) {
					continue;
				}

				if (axis === 'x') {
					if (movement > 0) {
						position = blockX - PLAYER_HALF_WIDTH - SKIN_WIDTH;
					} else {
						position = blockX + 1 + PLAYER_HALF_WIDTH + SKIN_WIDTH;
					}
				} else if (axis === 'y') {
					if (movement > 0) {
						position = blockY - playerHeight - SKIN_WIDTH;
					} else {
						position = blockY + 1 + SKIN_WIDTH;
					}
				} else if (movement > 0) {
					position = blockZ - PLAYER_HALF_WIDTH - SKIN_WIDTH;
				} else {
					position = blockZ + 1 + PLAYER_HALF_WIDTH + SKIN_WIDTH;
				}

				hit = true;
			}
		}
	}

	return { position, hit };
}

function probeGround(
	world: World,
	feetX: number,
	feetY: number,
	feetZ: number,
	playerHeight: number,
): boolean {
	void playerHeight;
	const probeY = feetY - 0.05;
	const offsets: readonly [number, number][] = [
		[-PLAYER_HALF_WIDTH + 0.05, -PLAYER_HALF_WIDTH + 0.05],
		[PLAYER_HALF_WIDTH - 0.05, -PLAYER_HALF_WIDTH + 0.05],
		[-PLAYER_HALF_WIDTH + 0.05, PLAYER_HALF_WIDTH - 0.05],
		[PLAYER_HALF_WIDTH - 0.05, PLAYER_HALF_WIDTH - 0.05],
	];

	for (const [offsetX, offsetZ] of offsets) {
		const blockX = Math.floor(feetX + offsetX);
		const blockY = Math.floor(probeY);
		const blockZ = Math.floor(feetZ + offsetZ);
		if (world.isBlockSolid(blockX, blockY, blockZ)) {
			return true;
		}
	}

	return false;
}
