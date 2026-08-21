import { BlockId, isOpaqueBlock } from '../voxel/BlockId';
import { CHUNK_SIZE } from '../voxel/WorldConstants';
import type { World } from '../voxel/World';
import type { WorldRenderer } from '../voxel/WorldRenderer';
import { QuickEquipEntryType } from '../equipment/QuickEquipEntry';
import type { QuickEquipManager } from '../equipment/QuickEquipManager';
import { QuickEquipChannel } from '../equipment/QuickEquipChannel';
import { buildPlayerAABB } from '../player/PlayerCollision';
import type { VoxelTarget } from './VoxelRaycast';

export class BlockInteraction {
	private readonly world: World;
	private readonly worldRenderer: WorldRenderer;
	private readonly quickEquip: QuickEquipManager;

	constructor(world: World, worldRenderer: WorldRenderer, quickEquip: QuickEquipManager) {
		this.world = world;
		this.worldRenderer = worldRenderer;
		this.quickEquip = quickEquip;
	}

	tryBreak(target: VoxelTarget): boolean {
		if (!target.hit) {
			return false;
		}

		if (!this.world.setBlock(target.blockX, target.blockY, target.blockZ, BlockId.AIR)) {
			return false;
		}

		this.remeshAt(target.blockX, target.blockZ);
		return true;
	}

	tryPlace(
		target: VoxelTarget,
		feetX: number,
		feetY: number,
		feetZ: number,
		playerHeight: number,
	): boolean {
		if (!target.hit) {
			return false;
		}

		const entry = this.quickEquip.getSelectedEntry(QuickEquipChannel.RIGHT_HAND);
		if (entry.type !== QuickEquipEntryType.BLOCK || entry.blockId === undefined) {
			return false;
		}

		if (!this.world.isInBounds(target.placeX, target.placeY, target.placeZ)) {
			return false;
		}

		if (isOpaqueBlock(this.world.getBlock(target.placeX, target.placeY, target.placeZ))) {
			return false;
		}

		const playerAabb = buildPlayerAABB(feetX, feetY, feetZ, playerHeight);
		const blockMinX = target.placeX;
		const blockMaxX = target.placeX + 1;
		const blockMinY = target.placeY;
		const blockMaxY = target.placeY + 1;
		const blockMinZ = target.placeZ;
		const blockMaxZ = target.placeZ + 1;

		const intersectsPlayer =
			playerAabb.minX < blockMaxX &&
			playerAabb.maxX > blockMinX &&
			playerAabb.minY < blockMaxY &&
			playerAabb.maxY > blockMinY &&
			playerAabb.minZ < blockMaxZ &&
			playerAabb.maxZ > blockMinZ;

		if (intersectsPlayer) {
			return false;
		}

		if (!this.world.setBlock(target.placeX, target.placeY, target.placeZ, entry.blockId)) {
			return false;
		}

		this.remeshAt(target.placeX, target.placeZ);
		return true;
	}

	private remeshAt(worldX: number, worldZ: number): void {
		const chunkX = Math.floor(worldX / CHUNK_SIZE);
		const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
		this.worldRenderer.markDirtyWithNeighbors(chunkX, chunkZ);
		this.worldRenderer.rebuildDirtyMeshes();
	}
}
