import * as THREE from 'three';
import { OrbitCamera } from './OrbitCamera';
import { World } from './voxel/World';
import { WorldRenderer } from './voxel/WorldRenderer';
import {
	CHUNK_COLUMN_COUNT,
	CHUNK_SIZE,
	SECTION_SIZE,
	WORLD_DEPTH,
	WORLD_MAX_Y,
	WORLD_MIN_Y,
	WORLD_WIDTH,
} from './voxel/WorldConstants';

export interface GameDebugStats {
	worldWidth: number;
	worldDepth: number;
	worldMinY: number;
	worldMaxY: number;
	chunkSize: number;
	sectionSize: number;
	chunkColumnCount: number;
	allocatedSectionCount: number;
	renderedMeshCount: number;
	visibleFaceCount: number;
	triangleCount: number;
	fps: number;
}

export class Game {
	private readonly container: HTMLElement;
	private readonly renderer: THREE.WebGLRenderer;
	private readonly scene: THREE.Scene;
	private readonly camera: THREE.PerspectiveCamera;
	private readonly world: World;
	private readonly worldRenderer: WorldRenderer;
	private readonly orbitCamera: OrbitCamera;
	private animationFrameId: number | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private statsCallback: ((stats: GameDebugStats) => void) | null = null;

	private lastFrameTime = performance.now();
	private fps = 0;
	private frameCount = 0;
	private fpsAccumulator = 0;

	constructor(container: HTMLElement) {
		this.container = container;

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.container.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87ceeb);

		this.camera = new THREE.PerspectiveCamera(
			60,
			this.container.clientWidth / this.container.clientHeight,
			0.1,
			2000,
		);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 200, 100);
		this.scene.add(directionalLight);

		this.world = new World();
		this.worldRenderer = new WorldRenderer(this.scene, this.world);
		this.worldRenderer.buildAllMeshes();

		this.orbitCamera = new OrbitCamera(this.camera, this.renderer.domElement);

		this.handleResize();
		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize();
		});
		this.resizeObserver.observe(this.container);

		this.start();
	}

	setStatsCallback(callback: (stats: GameDebugStats) => void): void {
		this.statsCallback = callback;
		callback(this.getDebugStats());
	}

	private getDebugStats(): GameDebugStats {
		const renderStats = this.worldRenderer.getStats();
		return {
			worldWidth: WORLD_WIDTH,
			worldDepth: WORLD_DEPTH,
			worldMinY: WORLD_MIN_Y,
			worldMaxY: WORLD_MAX_Y,
			chunkSize: CHUNK_SIZE,
			sectionSize: SECTION_SIZE,
			chunkColumnCount: CHUNK_COLUMN_COUNT,
			allocatedSectionCount: this.world.getAllocatedSectionCount(),
			renderedMeshCount: renderStats.meshCount,
			visibleFaceCount: renderStats.faceCount,
			triangleCount: renderStats.triangleCount,
			fps: this.fps,
		};
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

		const now = performance.now();
		const delta = now - this.lastFrameTime;
		this.lastFrameTime = now;

		this.frameCount++;
		this.fpsAccumulator += delta;
		if (this.fpsAccumulator >= 500) {
			this.fps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
			this.frameCount = 0;
			this.fpsAccumulator = 0;

			if (this.statsCallback) {
				this.statsCallback(this.getDebugStats());
			}
		}

		this.orbitCamera.update();
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

		this.orbitCamera.dispose();
		this.worldRenderer.dispose();

		this.renderer.dispose();

		if (this.renderer.domElement.parentElement === this.container) {
			this.container.removeChild(this.renderer.domElement);
		}
	}
}
