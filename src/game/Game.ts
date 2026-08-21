import * as THREE from 'three';
import { InputManager } from './input/InputManager';
import { PlayerCamera } from './player/PlayerCamera';
import { PlayerController } from './player/PlayerController';
import { findSpawnPosition } from './player/PlayerSpawn';
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
import type { InputMode } from './input/InputState';

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
	playerX: number;
	playerY: number;
	playerZ: number;
	chunkX: number;
	chunkZ: number;
	sectionY: number;
	velocityX: number;
	velocityY: number;
	velocityZ: number;
	grounded: boolean;
	movementMode: 'walk' | 'sprint';
	inputType: InputMode;
}

export class Game {
	private readonly container: HTMLElement;
	private readonly renderer: THREE.WebGLRenderer;
	private readonly scene: THREE.Scene;
	private readonly camera: THREE.PerspectiveCamera;
	private readonly world: World;
	private readonly worldRenderer: WorldRenderer;
	private readonly inputManager: InputManager;
	private readonly playerController: PlayerController;
	private readonly playerCamera: PlayerCamera;
	private animationFrameId: number | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private visualViewport: VisualViewport | null = null;
	private statsCallback: ((stats: GameDebugStats) => void) | null = null;

	private lastFrameTime = performance.now();
	private fps = 0;
	private frameCount = 0;
	private fpsAccumulator = 0;

	private readonly boundVisualViewportChange: () => void;

	constructor(container: HTMLElement) {
		this.container = container;

		this.boundVisualViewportChange = () => {
			this.handleResize();
			this.inputManager.onLayoutChange();
		};

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.domElement.style.touchAction = 'none';
		this.container.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87ceeb);

		this.camera = new THREE.PerspectiveCamera(
			70,
			this.container.clientWidth / this.container.clientHeight,
			0.1,
			1000,
		);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 200, 100);
		this.scene.add(directionalLight);

		this.world = new World();
		this.worldRenderer = new WorldRenderer(this.scene, this.world);
		this.worldRenderer.buildAllMeshes();

		const spawn = findSpawnPosition(this.world);
		this.playerController = new PlayerController(spawn.x, spawn.y, spawn.z);
		this.playerCamera = new PlayerCamera();
		this.inputManager = new InputManager(this.renderer.domElement);

		this.handleResize();
		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize();
			this.inputManager.onLayoutChange();
		});
		this.resizeObserver.observe(this.container);

		this.visualViewport = window.visualViewport;
		if (this.visualViewport) {
			this.visualViewport.addEventListener('resize', this.boundVisualViewportChange);
		}

		window.addEventListener('orientationchange', this.boundVisualViewportChange);

		this.renderer.domElement.addEventListener('contextmenu', (event) => {
			event.preventDefault();
		});

		this.start();
	}

	getInputMode(): InputMode {
		return this.inputManager.getInputMode();
	}

	attachTouchControls(root: HTMLElement): void {
		this.inputManager.attachTouchControls(root);
	}

	detachTouchControls(): void {
		this.inputManager.detachTouchControls();
	}

	setStatsCallback(callback: (stats: GameDebugStats) => void): void {
		this.statsCallback = callback;
		callback(this.getDebugStats());
	}

	setPointerLockCallback(callback: (locked: boolean) => void): void {
		this.inputManager.setPointerLockCallback(callback);
	}

	private getDebugStats(): GameDebugStats {
		const renderStats = this.worldRenderer.getStats();
		const player = this.playerController.getState();

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
			playerX: player.positionX,
			playerY: player.positionY,
			playerZ: player.positionZ,
			chunkX: Math.floor(player.positionX / CHUNK_SIZE),
			chunkZ: Math.floor(player.positionZ / CHUNK_SIZE),
			sectionY: Math.floor(player.positionY / SECTION_SIZE),
			velocityX: player.velocityX,
			velocityY: player.velocityY,
			velocityZ: player.velocityZ,
			grounded: player.grounded,
			movementMode: player.movementMode,
			inputType: this.inputManager.getInputMode(),
		};
	}

	private handleResize(): void {
		const viewport = window.visualViewport;
		const width = viewport?.width ?? this.container.clientWidth;
		const height = viewport?.height ?? this.container.clientHeight;

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
		const deltaMs = now - this.lastFrameTime;
		this.lastFrameTime = now;
		const delta = Math.min(deltaMs / 1000, 0.1);

		const input = this.inputManager.poll();
		this.playerCamera.applyLookInput(input, this.inputManager.getInputMode());
		this.playerController.update(delta, input, this.world, this.playerCamera.getYaw());

		const player = this.playerController.getState();
		this.playerCamera.updateCamera(
			this.camera,
			player.positionX,
			player.positionY,
			player.positionZ,
		);

		this.frameCount++;
		this.fpsAccumulator += deltaMs;
		if (this.fpsAccumulator >= 500) {
			this.fps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
			this.frameCount = 0;
			this.fpsAccumulator = 0;

			if (this.statsCallback) {
				this.statsCallback(this.getDebugStats());
			}
		}

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

		if (this.visualViewport) {
			this.visualViewport.removeEventListener('resize', this.boundVisualViewportChange);
		}
		window.removeEventListener('orientationchange', this.boundVisualViewportChange);

		this.inputManager.dispose();
		this.worldRenderer.dispose();

		this.renderer.dispose();

		if (this.renderer.domElement.parentElement === this.container) {
			this.container.removeChild(this.renderer.domElement);
		}
	}
}
