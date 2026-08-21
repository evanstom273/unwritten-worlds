import * as THREE from 'three';
import { getBlockColor, isOpaqueBlock } from './BlockId';
import type { BlockId } from './BlockId';
import type { ChunkColumn } from './ChunkColumn';
import { CHUNK_SIZE, SECTION_SIZE } from './WorldConstants';
import type { World } from './World';

export interface MeshBuildResult {
	geometry: THREE.BufferGeometry | null;
	faceCount: number;
	triangleCount: number;
}

interface FaceDirection {
	readonly dx: number;
	readonly dy: number;
	readonly dz: number;
	readonly vertices: readonly [number, number, number][];
}

const FACE_DIRECTIONS: readonly FaceDirection[] = [
	{
		dx: 1,
		dy: 0,
		dz: 0,
		vertices: [
			[1, 0, 0],
			[1, 1, 0],
			[1, 1, 1],
			[1, 0, 1],
		],
	},
	{
		dx: -1,
		dy: 0,
		dz: 0,
		vertices: [
			[0, 0, 1],
			[0, 1, 1],
			[0, 1, 0],
			[0, 0, 0],
		],
	},
	{
		dx: 0,
		dy: 1,
		dz: 0,
		vertices: [
			[0, 1, 1],
			[1, 1, 1],
			[1, 1, 0],
			[0, 1, 0],
		],
	},
	{
		dx: 0,
		dy: -1,
		dz: 0,
		vertices: [
			[0, 0, 0],
			[1, 0, 0],
			[1, 0, 1],
			[0, 0, 1],
		],
	},
	{
		dx: 0,
		dy: 0,
		dz: 1,
		vertices: [
			[1, 0, 1],
			[1, 1, 1],
			[0, 1, 1],
			[0, 0, 1],
		],
	},
	{
		dx: 0,
		dy: 0,
		dz: -1,
		vertices: [
			[0, 0, 0],
			[0, 1, 0],
			[1, 1, 0],
			[1, 0, 0],
		],
	},
];

export class ChunkMesher {
	buildSectionMesh(
		world: World,
		column: ChunkColumn,
		sectionY: number,
	): MeshBuildResult {
		const section = column.getSection(sectionY);
		if (!section) {
			return { geometry: null, faceCount: 0, triangleCount: 0 };
		}

		const positions: number[] = [];
		const colors: number[] = [];
		let faceCount = 0;

		const baseX = column.chunkX * CHUNK_SIZE;
		const baseZ = column.chunkZ * CHUNK_SIZE;
		const baseY = sectionY * SECTION_SIZE;

		for (let localY = 0; localY < SECTION_SIZE; localY++) {
			for (let localZ = 0; localZ < SECTION_SIZE; localZ++) {
				for (let localX = 0; localX < SECTION_SIZE; localX++) {
					const blockId = section.getBlock(localX, localY, localZ);
					if (!isOpaqueBlock(blockId)) {
						continue;
					}

					const worldX = baseX + localX;
					const worldY = baseY + localY;
					const worldZ = baseZ + localZ;

					for (const face of FACE_DIRECTIONS) {
						const neighborId = world.getBlock(
							worldX + face.dx,
							worldY + face.dy,
							worldZ + face.dz,
						);

						if (isOpaqueBlock(neighborId)) {
							continue;
						}

						this.addFace(
							positions,
							colors,
							worldX,
							worldY,
							worldZ,
							blockId,
							face.vertices,
						);
						faceCount++;
					}
				}
			}
		}

		if (faceCount === 0) {
			return { geometry: null, faceCount: 0, triangleCount: 0 };
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
		geometry.computeVertexNormals();

		return {
			geometry,
			faceCount,
			triangleCount: faceCount * 2,
		};
	}

	private addFace(
		positions: number[],
		colors: number[],
		worldX: number,
		worldY: number,
		worldZ: number,
		blockId: BlockId,
		vertices: readonly [number, number, number][],
	): void {
		const color = new THREE.Color(getBlockColor(blockId));

		const indices = [0, 1, 2, 0, 2, 3];
		for (const index of indices) {
			const [vx, vy, vz] = vertices[index];
			positions.push(worldX + vx, worldY + vy, worldZ + vz);
			colors.push(color.r, color.g, color.b);
		}
	}
}
