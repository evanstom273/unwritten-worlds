import * as THREE from 'three';

export class Game {
	private readonly container: HTMLElement;
	private readonly renderer: THREE.WebGLRenderer;
	private readonly scene: THREE.Scene;
	private readonly camera: THREE.PerspectiveCamera;
	private readonly cube: THREE.Mesh;
	private animationFrameId: number | null = null;
	private resizeObserver: ResizeObserver | null = null;

	constructor(container: HTMLElement) {
		this.container = container;

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.container.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x1a1a2e);

		this.camera = new THREE.PerspectiveCamera(
			75,
			this.container.clientWidth / this.container.clientHeight,
			0.1,
			1000,
		);
		this.camera.position.z = 3;

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(2, 3, 4);
		this.scene.add(directionalLight);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
		this.cube = new THREE.Mesh(geometry, material);
		this.scene.add(this.cube);

		this.handleResize();
		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize();
		});
		this.resizeObserver.observe(this.container);

		this.start();
	}

	private handleResize(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		if (width === 0 || height === 0) {
			return;
		}

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	}

	private animate = (): void => {
		this.animationFrameId = requestAnimationFrame(this.animate);

		this.cube.rotation.x += 0.01;
		this.cube.rotation.y += 0.015;

		this.renderer.render(this.scene, this.camera);
	};

	private start(): void {
		this.animate();
	}

	dispose(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		if (this.resizeObserver !== null) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		this.cube.geometry.dispose();
		const cubeMaterial = this.cube.material;
		if (Array.isArray(cubeMaterial)) {
			cubeMaterial.forEach((material) => {
				material.dispose();
			});
		} else {
			cubeMaterial.dispose();
		}

		this.renderer.dispose();

		if (this.renderer.domElement.parentElement === this.container) {
			this.container.removeChild(this.renderer.domElement);
		}
	}
}
