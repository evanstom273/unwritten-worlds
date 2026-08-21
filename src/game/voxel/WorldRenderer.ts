import * as THREE from 'three';
import { ChunkMesher } from './ChunkMesher';
import type { World } from './World';

export interface WorldRenderStats {
	meshCount: number;
	faceCount: number;
	triangleCount: number;
}

export class WorldRenderer {
	private readonly scene: THREE.Scene;
	private readonly world: World;
	private readonly mesher: ChunkMesher;
	private readonly chunkGroup: THREE.Group;
	private readonly material: THREE.MeshLambertMaterial;
	private readonly meshes: THREE.Mesh[] = [];
	private totalFaces = 0;
	private totalTriangles = 0;

	constructor(scene: THREE.Scene, world: World) {
		this.scene = scene;
		this.world = world;
		this.mesher = new ChunkMesher();
		this.chunkGroup = new THREE.Group();
		this.material = new THREE.MeshLambertMaterial({ vertexColors: true });
		this.scene.add(this.chunkGroup);
	}

	buildAllMeshes(): void {
		this.clearMeshes();

		for (const column of this.world.getChunkColumns()) {
			for (const sectionY of column.getSectionIndices()) {
				const result = this.mesher.buildSectionMesh(this.world, column, sectionY);
				if (!result.geometry) {
					continue;
				}

				const mesh = new THREE.Mesh(result.geometry, this.material);
				this.chunkGroup.add(mesh);
				this.meshes.push(mesh);
				this.totalFaces += result.faceCount;
				this.totalTriangles += result.triangleCount;
			}
		}
	}

	getStats(): WorldRenderStats {
		return {
			meshCount: this.meshes.length,
			faceCount: this.totalFaces,
			triangleCount: this.totalTriangles,
		};
	}

	dispose(): void {
		this.clearMeshes();
		this.material.dispose();
		this.scene.remove(this.chunkGroup);
	}

	private clearMeshes(): void {
		for (const mesh of this.meshes) {
			mesh.geometry.dispose();
			this.chunkGroup.remove(mesh);
		}
		this.meshes.length = 0;
		this.totalFaces = 0;
		this.totalTriangles = 0;
	}
}
