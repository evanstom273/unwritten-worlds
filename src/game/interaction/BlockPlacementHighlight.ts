import * as THREE from 'three';

export class BlockPlacementHighlight {
	private readonly scene: THREE.Scene;
	private readonly mesh: THREE.LineSegments;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
		const material = new THREE.LineBasicMaterial({
			color: 0x55ff99,
			transparent: true,
			opacity: 0.9,
			depthTest: true,
		});
		this.mesh = new THREE.LineSegments(geometry, material);
		this.mesh.visible = false;
		this.scene.add(this.mesh);
	}

	updatePlacement(placeX: number, placeY: number, placeZ: number, visible: boolean): void {
		this.mesh.visible = visible;
		if (!visible) {
			return;
		}

		this.mesh.position.set(placeX + 0.5, placeY + 0.5, placeZ + 0.5);
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
