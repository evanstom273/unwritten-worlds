import * as THREE from 'three';
import type { World } from '../voxel/World';
import { raycastVoxels, type VoxelTarget } from './VoxelRaycast';

export function raycastVoxelsFromScreen(
	world: World,
	camera: THREE.PerspectiveCamera,
	canvas: HTMLElement,
	clientX: number,
	clientY: number,
	maxDistance = 8,
): VoxelTarget {
	const rect = canvas.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) {
		return raycastVoxels(world, 0, 0, 0, 0, 0, 0, maxDistance);
	}

	const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
	const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

	const ndc = new THREE.Vector2(ndcX, ndcY);
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(ndc, camera);

	const origin = raycaster.ray.origin;
	const direction = raycaster.ray.direction;

	return raycastVoxels(
		world,
		origin.x,
		origin.y,
		origin.z,
		direction.x,
		direction.y,
		direction.z,
		maxDistance,
	);
}
