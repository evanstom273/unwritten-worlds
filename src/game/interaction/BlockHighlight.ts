import * as THREE from 'three';

export class BlockHighlight {
	private readonly scene: THREE.Scene;
	private readonly mesh: THREE.LineSegments;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
		const material = new THREE.LineBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.85,
			depthTest: true,
		});
		this.mesh = new THREE.LineSegments(geometry, material);
		this.mesh.visible = false;
		this.scene.add(this.mesh);
	}

	updateTarget(blockX: number, blockY: number, blockZ: number, hit: boolean): void {
		this.mesh.visible = hit;
		if (!hit) {
			return;
		}

		this.mesh.position.set(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
	}

	dispose(): void {
		this.mesh.geometry.dispose();
		const material = this.mesh.material;
		if (Array.isArray(material)) {
			material.forEach((entry) => entry.dispose());
		} else {
			material.dispose();
		}
		this.scene.remove(this.mesh);
	}
}
