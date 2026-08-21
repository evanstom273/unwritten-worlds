import * as THREE from 'three';

export const ChunkMeshState = {
	VoxelDataOnly: 'voxel-data-only',
	Dirty: 'dirty',
	Built: 'built',
} as const;

export type ChunkMeshState = (typeof ChunkMeshState)[keyof typeof ChunkMeshState];

export interface ChunkMeshEntry {
	readonly chunkX: number;
	readonly chunkZ: number;
	mesh: THREE.Mesh | null;
	state: ChunkMeshState;
	active: boolean;
	faceCount: number;
	triangleCount: number;
}
