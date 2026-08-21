import * as THREE from 'three';
import { DEBUG_STATS_INTERVAL_MS, MAX_PIXEL_RATIO } from './config/RenderConfig';
import { QuickEquipManager, type QuickEquipSnapshot } from './equipment/QuickEquipManager';
import { QuickEquipChannel } from './equipment/QuickEquipChannel';
import { InputManager } from './input/InputManager';
import { BlockHighlight } from './interaction/BlockHighlight';
import { BlockInteraction } from './interaction/BlockInteraction';
import { BlockPlacementHighlight } from './interaction/BlockPlacementHighlight';
import { raycastVoxelsFromScreen } from './interaction/ScreenVoxelRaycast';
import { raycastVoxels, type VoxelTarget } from './interaction/VoxelRaycast';
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
	builtMeshCount: number;
	activeMeshCount: number;
	visibleFaceCount: number;
	triangleCount: number;
	drawCalls: number;
	renderDistance: number;
	pixelRatio: number;
	fps: number;
	fpsMin: number;
	fpsMax: number;
	fpsAvg: number;
	frameTimeMs: number;
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
	movementMode: 'walk' | 'sprint' | 'crouch' | 'fly';
	inputType: InputMode;
	targetBlockX: number;
	targetBlockY: number;
	targetBlockZ: number;
	targetFace: string;
	placeBlockX: number;
	placeBlockY: number;
	placeBlockZ: number;
	targetHit: boolean;
}

export type { QuickEquipSnapshot };

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
	private readonly quickEquip: QuickEquipManager;
	private readonly blockInteraction: BlockInteraction;
	private readonly blockHighlight: BlockHighlight;
	private readonly blockPlacementHighlight: BlockPlacementHighlight;
	private readonly rayOrigin = new THREE.Vector3();
	private readonly rayDirection = new THREE.Vector3();
	private quickEquipCallback: ((snapshot: QuickEquipSnapshot) => void) | null = null;
	private animationFrameId: number | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private visualViewport: VisualViewport | null = null;
	private statsCallback: ((stats: GameDebugStats) => void) | null = null;

	private lastFrameTime = performance.now();
	private fps = 0;
	private fpsMin = 0;
	private fpsMax = 0;
	private fpsAvg = 0;
	private frameTimeMs = 0;
	private lastDrawCalls = 0;
	private frameCount = 0;
	private fpsAccumulator = 0;
	private fpsSampleMin = Number.POSITIVE_INFINITY;
	private fpsSampleMax = 0;
	private fpsSampleSum = 0;
	private fpsSampleCount = 0;

	private readonly boundVisualViewportChange: () => void;

	constructor(container: HTMLElement) {
		this.container = container;

		this.boundVisualViewportChange = () => {
			this.handleResize();
			this.inputManager.onLayoutChange();
		};

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
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

		const spawn = findSpawnPosition(this.world);
		this.playerController = new PlayerController(spawn.x, spawn.y, spawn.z);
		this.playerCamera = new PlayerCamera();
		this.quickEquip = new QuickEquipManager();
		this.blockInteraction = new BlockInteraction(this.world, this.worldRenderer, this.quickEquip);
		this.blockHighlight = new BlockHighlight(this.scene);
		this.blockPlacementHighlight = new BlockPlacementHighlight(this.scene);
		this.inputManager = new InputManager(this.renderer.domElement);

		const spawnChunkX = Math.floor(spawn.x / CHUNK_SIZE);
		const spawnChunkZ = Math.floor(spawn.z / CHUNK_SIZE);
		this.worldRenderer.initialize(spawnChunkX, spawnChunkZ);

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
		this.inputManager.attachTouchControls(root, {
			onCycle: (channel) => {
				this.cycleEquipChannel(channel);
			},
			onReset: (channel) => {
				this.resetEquipChannel(channel);
			},
		});
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

	setQuickEquipCallback(callback: (snapshot: QuickEquipSnapshot) => void): void {
		this.quickEquipCallback = callback;
		callback(this.quickEquip.getSnapshot());
	}

	cycleEquipChannel(channel: QuickEquipChannel): void {
		this.quickEquip.cycle(channel);
		this.notifyQuickEquipChanged();
	}

	resetEquipChannel(channel: QuickEquipChannel): void {
		this.quickEquip.resetToFirst(channel);
		this.notifyQuickEquipChanged();
	}

	private notifyQuickEquipChanged(): void {
		if (this.quickEquipCallback) {
			this.quickEquipCallback(this.quickEquip.getSnapshot());
		}
	}

	private handleEquipmentInput(input: ReturnType<InputManager['poll']>): void {
		let changed = false;

		if (input.cycleLeftHand) {
			this.quickEquip.cycle(QuickEquipChannel.LEFT_HAND);
			changed = true;
		}
		if (input.cycleRightHand) {
			this.quickEquip.cycle(QuickEquipChannel.RIGHT_HAND);
			changed = true;
		}
		if (input.cycleTop) {
			this.quickEquip.cycle(QuickEquipChannel.TOP);
			changed = true;
		}
		if (input.cycleUtility) {
			this.quickEquip.cycle(QuickEquipChannel.UTILITY);
			changed = true;
		}
		if (input.resetLeftHand) {
			this.quickEquip.resetToFirst(QuickEquipChannel.LEFT_HAND);
			changed = true;
		}
		if (input.resetRightHand) {
			this.quickEquip.resetToFirst(QuickEquipChannel.RIGHT_HAND);
			changed = true;
		}
		if (input.resetTop) {
			this.quickEquip.resetToFirst(QuickEquipChannel.TOP);
			changed = true;
		}
		if (input.resetUtility) {
			this.quickEquip.resetToFirst(QuickEquipChannel.UTILITY);
			changed = true;
		}

		if (changed) {
			this.notifyQuickEquipChanged();
		}
	}

	private updateTargeting(player: ReturnType<PlayerController['getState']>): void {
		const crosshairTarget = this.raycastFromCrosshair(player);

		if (this.pinnedScreenX !== null && this.pinnedScreenY !== null) {
			const pinnedTarget = raycastVoxelsFromScreen(
				this.world,
				this.camera,
				this.renderer.domElement,
				this.pinnedScreenX,
				this.pinnedScreenY,
			);
			this.applyTargetSelection(pinnedTarget);

			if (this.targetsSameBlock(crosshairTarget, pinnedTarget)) {
				this.clearPinnedSelection();
			}
			return;
		}

		this.applyTargetSelection(crosshairTarget);
	}

	private lastTarget: VoxelTarget = {
		hit: false,
		blockX: 0,
		blockY: 0,
		blockZ: 0,
		hitPositionX: 0,
		hitPositionY: 0,
		hitPositionZ: 0,
		normalX: 0,
		normalY: 0,
		normalZ: 0,
		face: null,
		placeX: 0,
		placeY: 0,
		placeZ: 0,
	};

	private pinnedScreenX: number | null = null;
	private pinnedScreenY: number | null = null;

	private applyTargetSelection(target: VoxelTarget): void {
		this.lastTarget = target;
		this.blockHighlight.updateTarget(target.blockX, target.blockY, target.blockZ, target.hit);
		this.blockPlacementHighlight.updatePlacement(
			target.placeX,
			target.placeY,
			target.placeZ,
			target.hit,
		);
	}

	private clearPinnedSelection(): void {
		this.pinnedScreenX = null;
		this.pinnedScreenY = null;
	}

	private raycastFromCrosshair(player: ReturnType<PlayerController['getState']>): VoxelTarget {
		this.rayOrigin.set(
			player.positionX,
			player.positionY + player.eyeHeight,
			player.positionZ,
		);
		this.playerCamera.getLookDirection(this.rayDirection);

		return raycastVoxels(
			this.world,
			this.rayOrigin.x,
			this.rayOrigin.y,
			this.rayOrigin.z,
			this.rayDirection.x,
			this.rayDirection.y,
			this.rayDirection.z,
		);
	}

	private pinSelectionFromScreen(screenX: number, screenY: number): void {
		this.pinnedScreenX = screenX;
		this.pinnedScreenY = screenY;

		const target = raycastVoxelsFromScreen(
			this.world,
			this.camera,
			this.renderer.domElement,
			screenX,
			screenY,
		);
		this.applyTargetSelection(target);
	}

	private targetsSameBlock(a: VoxelTarget, b: VoxelTarget): boolean {
		return (
			a.hit &&
			b.hit &&
			a.blockX === b.blockX &&
			a.blockY === b.blockY &&
			a.blockZ === b.blockZ
		);
	}

	private handleBlockInteraction(
		input: ReturnType<InputManager['poll']>,
		player: ReturnType<PlayerController['getState']>,
	): void {
		const isTouch = this.inputManager.getInputMode() === 'touch';
		const screenX = input.touchActionScreenX;
		const screenY = input.touchActionScreenY;
		const usesScreenRay =
			isTouch &&
			screenX !== null &&
			screenY !== null &&
			(input.primaryActionPressed || input.secondaryActionPressed);

		const target = usesScreenRay
			? raycastVoxelsFromScreen(
				this.world,
				this.camera,
				this.renderer.domElement,
				screenX,
				screenY,
			)
			: this.lastTarget;

		if (!target.hit) {
			return;
		}

		let acted = false;

		if (input.primaryActionPressed) {
			acted = this.blockInteraction.tryBreak(target) || acted;
		}

		if (input.secondaryActionPressed) {
			acted =
				this.blockInteraction.tryPlace(
					target,
					player.positionX,
					player.positionY,
					player.positionZ,
					player.playerHeight,
				) || acted;
		}

		if (acted && usesScreenRay && screenX !== null && screenY !== null) {
			this.pinSelectionFromScreen(screenX, screenY);
		}
	}

	private getDebugStats(): GameDebugStats {
		const renderStats = this.worldRenderer.getStats();
		const activeStats = this.worldRenderer.getActiveStats();
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
			builtMeshCount: renderStats.builtMeshCount,
			activeMeshCount: renderStats.activeMeshCount,
			visibleFaceCount: activeStats.faceCount,
			triangleCount: activeStats.triangleCount,
			drawCalls: this.lastDrawCalls,
			renderDistance: renderStats.renderDistance,
			pixelRatio: this.renderer.getPixelRatio(),
			fps: this.fps,
			fpsMin: this.fpsMin,
			fpsMax: this.fpsMax,
			fpsAvg: this.fpsAvg,
			frameTimeMs: this.frameTimeMs,
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
			targetBlockX: this.lastTarget.blockX,
			targetBlockY: this.lastTarget.blockY,
			targetBlockZ: this.lastTarget.blockZ,
			targetFace: this.lastTarget.face ?? '—',
			placeBlockX: this.lastTarget.placeX,
			placeBlockY: this.lastTarget.placeY,
			placeBlockZ: this.lastTarget.placeZ,
			targetHit: this.lastTarget.hit,
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
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
	}

	private animate = (): void => {
		this.animationFrameId = requestAnimationFrame(this.animate);

		const now = performance.now();
		const deltaMs = now - this.lastFrameTime;
		this.lastFrameTime = now;
		this.frameTimeMs = deltaMs;
		const delta = Math.min(deltaMs / 1000, 0.1);

		const input = this.inputManager.poll();
		this.handleEquipmentInput(input);
		this.playerCamera.applyLookInput(input, this.inputManager.getInputMode());
		this.playerController.update(
			delta,
			input,
			this.world,
			this.playerCamera.getYaw(),
		);

		const player = this.playerController.getState();
		this.updateTargeting(player);
		this.handleBlockInteraction(input, player);
		this.inputManager.consumeEdgeActions();

		this.playerCamera.update(delta, player);
		this.playerCamera.updateCamera(
			this.camera,
			player.positionX,
			player.positionY,
			player.positionZ,
			player.eyeHeight,
		);

		const playerChunkX = Math.floor(player.positionX / CHUNK_SIZE);
		const playerChunkZ = Math.floor(player.positionZ / CHUNK_SIZE);
		this.worldRenderer.update(playerChunkX, playerChunkZ);

		this.frameCount++;
		this.fpsAccumulator += deltaMs;

		const instantFps = deltaMs > 0 ? 1000 / deltaMs : 0;
		this.fpsSampleMin = Math.min(this.fpsSampleMin, instantFps);
		this.fpsSampleMax = Math.max(this.fpsSampleMax, instantFps);
		this.fpsSampleSum += instantFps;
		this.fpsSampleCount++;

		if (this.fpsAccumulator >= DEBUG_STATS_INTERVAL_MS) {
			this.fps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
			this.fpsMin = this.fpsSampleCount > 0 ? Math.round(this.fpsSampleMin) : this.fps;
			this.fpsMax = this.fpsSampleCount > 0 ? Math.round(this.fpsSampleMax) : this.fps;
			this.fpsAvg = this.fpsSampleCount > 0
				? Math.round(this.fpsSampleSum / this.fpsSampleCount)
				: this.fps;
			this.frameCount = 0;
			this.fpsAccumulator = 0;
			this.fpsSampleMin = Number.POSITIVE_INFINITY;
			this.fpsSampleMax = 0;
			this.fpsSampleSum = 0;
			this.fpsSampleCount = 0;

			if (this.statsCallback) {
				this.statsCallback(this.getDebugStats());
			}
		}

		this.renderer.render(this.scene, this.camera);
		this.lastDrawCalls = this.renderer.info.render.calls;
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
		this.blockHighlight.dispose();
		this.blockPlacementHighlight.dispose();
		this.worldRenderer.dispose();

		this.renderer.dispose();

		if (this.renderer.domElement.parentElement === this.container) {
			this.container.removeChild(this.renderer.domElement);
		}
	}
}
