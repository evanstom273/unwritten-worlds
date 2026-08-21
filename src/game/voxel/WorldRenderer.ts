import * as THREE from 'three';
import { RENDER_DISTANCE_CHUNKS } from '../config/RenderConfig';
import { createSharedTerrainMaterial, createTerrainAtlasTexture } from '../textures/TerrainMaterial';
import { ChunkMeshState, type ChunkMeshEntry } from './ChunkMeshEntry';
import { ChunkMesher } from './ChunkMesher';
import { CHUNKS_X } from './WorldConstants';
import type { World } from './World';

export interface WorldRenderStats {
	builtMeshCount: number;
	activeMeshCount: number;
	faceCount: number;
	triangleCount: number;
	renderDistance: number;
}

export class WorldRenderer {
	private readonly scene: THREE.Scene;
	private readonly world: World;
	private readonly mesher: ChunkMesher;
	private readonly chunkGroup: THREE.Group;
	private readonly material: THREE.MeshLambertMaterial;
	private readonly atlasTexture: THREE.Texture;
	private readonly entries: Map<number, ChunkMeshEntry> = new Map();
	private totalFaces = 0;
	private totalTriangles = 0;
	private activeMeshCount = 0;
	private lastPlayerChunkX = Number.NaN;
	private lastPlayerChunkZ = Number.NaN;

	constructor(scene: THREE.Scene, world: World) {
		this.scene = scene;
		this.world = world;
		this.mesher = new ChunkMesher();
		this.chunkGroup = new THREE.Group();
		this.atlasTexture = createTerrainAtlasTexture();
		this.material = createSharedTerrainMaterial(this.atlasTexture);
		this.scene.add(this.chunkGroup);

		for (const column of this.world.getChunkColumns()) {
			this.entries.set(this.columnKey(column.chunkX, column.chunkZ), {
				chunkX: column.chunkX,
				chunkZ: column.chunkZ,
				mesh: null,
				state: ChunkMeshState.Dirty,
				active: false,
				faceCount: 0,
				triangleCount: 0,
			});
		}
	}

	initialize(playerChunkX: number, playerChunkZ: number): void {
		this.rebuildDirtyMeshes();
		this.updateActiveSet(playerChunkX, playerChunkZ);
	}

	update(playerChunkX: number, playerChunkZ: number): void {
		if (
			playerChunkX === this.lastPlayerChunkX &&
			playerChunkZ === this.lastPlayerChunkZ
		) {
			return;
		}

		this.updateActiveSet(playerChunkX, playerChunkZ);
	}

	markDirty(chunkX: number, chunkZ: number): void {
		const entry = this.entries.get(this.columnKey(chunkX, chunkZ));
		if (!entry) {
			return;
		}

		entry.state = ChunkMeshState.Dirty;
	}

	markDirtyWithNeighbors(chunkX: number, chunkZ: number): void {
		this.markDirty(chunkX, chunkZ);
		this.markDirty(chunkX + 1, chunkZ);
		this.markDirty(chunkX - 1, chunkZ);
		this.markDirty(chunkX, chunkZ + 1);
		this.markDirty(chunkX, chunkZ - 1);
	}

	rebuildDirtyMeshes(): void {
		for (const entry of this.entries.values()) {
			if (entry.state !== ChunkMeshState.Dirty) {
				continue;
			}
			this.buildEntryMesh(entry);
		}

		this.recalculateTotals();
	}

	getStats(): WorldRenderStats {
		return {
			builtMeshCount: this.countBuiltMeshes(),
			activeMeshCount: this.activeMeshCount,
			faceCount: this.totalFaces,
			triangleCount: this.totalTriangles,
			renderDistance: RENDER_DISTANCE_CHUNKS,
		};
	}

	getActiveStats(): { faceCount: number; triangleCount: number } {
		let faceCount = 0;
		let triangleCount = 0;

		for (const entry of this.entries.values()) {
			if (!entry.active || !entry.mesh) {
				continue;
			}
			faceCount += entry.faceCount;
			triangleCount += entry.triangleCount;
		}

		return { faceCount, triangleCount };
	}

	dispose(): void {
		for (const entry of this.entries.values()) {
			this.disposeEntryMesh(entry);
		}
		this.entries.clear();
		this.material.dispose();
		this.atlasTexture.dispose();
		this.scene.remove(this.chunkGroup);
	}

	private buildEntryMesh(entry: ChunkMeshEntry): void {
		this.disposeEntryMesh(entry);

		const column = this.world.getChunkColumn(entry.chunkX, entry.chunkZ);
		if (!column) {
			entry.state = ChunkMeshState.Built;
			entry.faceCount = 0;
			entry.triangleCount = 0;
			return;
		}

		const result = this.mesher.buildColumnMesh(this.world, column);
		entry.faceCount = result.faceCount;
		entry.triangleCount = result.triangleCount;

		if (!result.geometry) {
			entry.state = ChunkMeshState.Built;
			return;
		}

		const mesh = new THREE.Mesh(result.geometry, this.material);
		mesh.frustumCulled = true;
		mesh.visible = entry.active;
		this.chunkGroup.add(mesh);
		entry.mesh = mesh;
		entry.state = ChunkMeshState.Built;
	}

	private updateActiveSet(playerChunkX: number, playerChunkZ: number): void {
		this.lastPlayerChunkX = playerChunkX;
		this.lastPlayerChunkZ = playerChunkZ;
		this.activeMeshCount = 0;

		for (const entry of this.entries.values()) {
			const dx = Math.abs(entry.chunkX - playerChunkX);
			const dz = Math.abs(entry.chunkZ - playerChunkZ);
			const inRange =
				dx <= RENDER_DISTANCE_CHUNKS &&
				dz <= RENDER_DISTANCE_CHUNKS;

			entry.active = inRange;

			if (inRange && entry.state === ChunkMeshState.Dirty) {
				this.buildEntryMesh(entry);
			}

			if (entry.mesh) {
				entry.mesh.visible = inRange;
				if (inRange) {
					this.activeMeshCount++;
				}
			}
		}

		this.recalculateTotals();
	}

	private recalculateTotals(): void {
		this.totalFaces = 0;
		this.totalTriangles = 0;

		for (const entry of this.entries.values()) {
			if (!entry.active) {
				continue;
			}
			this.totalFaces += entry.faceCount;
			this.totalTriangles += entry.triangleCount;
		}
	}

	private countBuiltMeshes(): number {
		let count = 0;
		for (const entry of this.entries.values()) {
			if (entry.mesh) {
				count++;
			}
		}
		return count;
	}

	private disposeEntryMesh(entry: ChunkMeshEntry): void {
		if (!entry.mesh) {
			return;
		}

		entry.mesh.geometry.dispose();
		this.chunkGroup.remove(entry.mesh);
		entry.mesh = null;
	}

	private columnKey(chunkX: number, chunkZ: number): number {
		return chunkX + chunkZ * CHUNKS_X;
	}
}
