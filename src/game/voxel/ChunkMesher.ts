import * as THREE from 'three';
import { isOpaqueBlock } from './BlockId';
import type { BlockId } from './BlockId';
import type { ChunkColumn } from './ChunkColumn';
import { faceFromDirection, getBlockFaceTexture } from '../textures/BlockDefinition';
import { getAtlasTile } from '../textures/TextureId';
import { CHUNK_SIZE, SECTION_SIZE } from './WorldConstants';
import type { World } from './World';
import { MeshBuilder } from './MeshBuilder';

export interface MeshBuildResult {
	geometry: THREE.BufferGeometry | null;
	faceCount: number;
	triangleCount: number;
}

interface FaceDirection {
	readonly dx: number;
	readonly dy: number;
	readonly dz: number;
	readonly corners: readonly [
		readonly [number, number, number],
		readonly [number, number, number],
		readonly [number, number, number],
		readonly [number, number, number],
	];
	readonly uvs: readonly [
		readonly [number, number],
		readonly [number, number],
		readonly [number, number],
		readonly [number, number],
	];
}

const FACE_DIRECTIONS: readonly FaceDirection[] = [
	{
		dx: 1,
		dy: 0,
		dz: 0,
		corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]],
		uvs: [[0, 1], [0, 0], [1, 0], [1, 1]],
	},
	{
		dx: -1,
		dy: 0,
		dz: 0,
		corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]],
		uvs: [[0, 1], [0, 0], [1, 0], [1, 1]],
	},
	{
		dx: 0,
		dy: 1,
		dz: 0,
		corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
		uvs: [[0, 1], [1, 1], [1, 0], [0, 0]],
	},
	{
		dx: 0,
		dy: -1,
		dz: 0,
		corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
		uvs: [[0, 0], [1, 0], [1, 1], [0, 1]],
	},
	{
		dx: 0,
		dy: 0,
		dz: 1,
		corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]],
		uvs: [[0, 1], [0, 0], [1, 0], [1, 1]],
	},
	{
		dx: 0,
		dy: 0,
		dz: -1,
		corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]],
		uvs: [[0, 1], [0, 0], [1, 0], [1, 1]],
	},
];

export class ChunkMesher {
	private readonly builder = new MeshBuilder();

	buildColumnMesh(world: World, column: ChunkColumn): MeshBuildResult {
		this.builder.reset();

		const baseX = column.chunkX * CHUNK_SIZE;
		const baseZ = column.chunkZ * CHUNK_SIZE;

		for (const sectionY of column.getSectionIndices()) {
			const section = column.getSection(sectionY);
			if (!section) {
				continue;
			}

			const baseY = sectionY * SECTION_SIZE;

			for (let localY = 0; localY < SECTION_SIZE; localY++) {
				for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
					for (let localX = 0; localX < CHUNK_SIZE; localX++) {
						const blockId = section.getBlock(localX, localY, localZ);
						if (!isOpaqueBlock(blockId)) {
							continue;
						}

						const worldX = baseX + localX;
						const worldY = baseY + localY;
						const worldZ = baseZ + localZ;

						this.emitBlockFaces(world, blockId, worldX, worldY, worldZ);
					}
				}
			}
		}

		const faceCount = this.builder.getFaceCount();
		if (faceCount === 0) {
			return { geometry: null, faceCount: 0, triangleCount: 0 };
		}

		return {
			geometry: this.builder.buildGeometry(),
			faceCount,
			triangleCount: this.builder.getTriangleCount(),
		};
	}

	private emitBlockFaces(
		world: World,
		blockId: BlockId,
		worldX: number,
		worldY: number,
		worldZ: number,
	): void {
		for (const face of FACE_DIRECTIONS) {
			const neighborId = world.getBlock(
				worldX + face.dx,
				worldY + face.dy,
				worldZ + face.dz,
			);

			if (isOpaqueBlock(neighborId)) {
				continue;
			}

			const blockFace = faceFromDirection(face.dx, face.dy, face.dz);
			const textureId = getBlockFaceTexture(blockId, blockFace);
			if (textureId === undefined) {
				continue;
			}

			const tile = getAtlasTile(textureId);
			const [c0, c1, c2, c3] = face.corners;
			const [uv0, uv1, uv2, uv3] = face.uvs;

			this.builder.addFace(
				worldX + c0[0],
				worldY + c0[1],
				worldZ + c0[2],
				worldX + c1[0],
				worldY + c1[1],
				worldZ + c1[2],
				worldX + c2[0],
				worldY + c2[1],
				worldZ + c2[2],
				worldX + c3[0],
				worldY + c3[1],
				worldZ + c3[2],
				lerpUv(tile.u0, tile.u1, uv0[0]),
				lerpUv(tile.v0, tile.v1, uv0[1]),
				lerpUv(tile.u0, tile.u1, uv1[0]),
				lerpUv(tile.v0, tile.v1, uv1[1]),
				lerpUv(tile.u0, tile.u1, uv2[0]),
				lerpUv(tile.v0, tile.v1, uv2[1]),
				lerpUv(tile.u0, tile.u1, uv3[0]),
				lerpUv(tile.v0, tile.v1, uv3[1]),
			);
		}
	}
}

function lerpUv(min: number, max: number, t: number): number {
	return min + (max - min) * t;
}
