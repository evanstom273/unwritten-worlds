import * as THREE from 'three';
import { WORLD_DEPTH, WORLD_WIDTH } from './voxel/WorldConstants';

const ROTATE_SENSITIVITY = 0.005;
const MIN_DISTANCE = 30;
const MAX_DISTANCE = 500;

export class OrbitCamera {
	private readonly camera: THREE.PerspectiveCamera;
	private readonly target: THREE.Vector3;
	private readonly domElement: HTMLElement;

	private azimuth = Math.PI * 0.25;
	private elevation = Math.PI * 0.3;
	private distance = 200;

	private activePointerId: number | null = null;
	private lastPinchDistance: number | null = null;
	private activePointers: Map<number, { x: number; y: number }> = new Map();
	private isListeningOnWindow = false;

	private readonly boundPointerDown: (event: PointerEvent) => void;
	private readonly boundPointerMove: (event: PointerEvent) => void;
	private readonly boundPointerUp: (event: PointerEvent) => void;
	private readonly boundWheel: (event: WheelEvent) => void;

	constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
		this.camera = camera;
		this.domElement = domElement;
		this.target = new THREE.Vector3(WORLD_WIDTH / 2, 32, WORLD_DEPTH / 2);

		this.domElement.style.touchAction = 'none';

		this.boundPointerDown = (event) => {
			this.onPointerDown(event);
		};
		this.boundPointerMove = (event) => {
			this.onPointerMove(event);
		};
		this.boundPointerUp = (event) => {
			this.onPointerUp(event);
		};
		this.boundWheel = (event) => {
			this.onWheel(event);
		};

		domElement.addEventListener('pointerdown', this.boundPointerDown);
		domElement.addEventListener('wheel', this.boundWheel, { passive: false });

		this.updateCameraPosition();
	}

	dispose(): void {
		this.stopWindowListeners();
		this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
		this.domElement.removeEventListener('wheel', this.boundWheel);
	}

	private startWindowListeners(): void {
		if (this.isListeningOnWindow) {
			return;
		}

		window.addEventListener('pointermove', this.boundPointerMove, { capture: true });
		window.addEventListener('pointerup', this.boundPointerUp, { capture: true });
		window.addEventListener('pointercancel', this.boundPointerUp, { capture: true });
		this.isListeningOnWindow = true;
	}

	private stopWindowListeners(): void {
		if (!this.isListeningOnWindow) {
			return;
		}

		window.removeEventListener('pointermove', this.boundPointerMove, { capture: true });
		window.removeEventListener('pointerup', this.boundPointerUp, { capture: true });
		window.removeEventListener('pointercancel', this.boundPointerUp, { capture: true });
		this.isListeningOnWindow = false;
	}

	private onPointerDown(event: PointerEvent): void {
		event.preventDefault();

		this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		this.startWindowListeners();

		if (this.activePointers.size === 1) {
			this.activePointerId = event.pointerId;
		} else if (this.activePointers.size === 2) {
			this.activePointerId = null;
			this.lastPinchDistance = this.getPinchDistance();
		}

		this.domElement.setPointerCapture(event.pointerId);
	}

	private onPointerMove(event: PointerEvent): void {
		if (!this.activePointers.has(event.pointerId)) {
			return;
		}

		event.preventDefault();

		const previous = this.activePointers.get(event.pointerId);
		if (!previous) {
			return;
		}

		const deltaX = event.clientX - previous.x;
		const deltaY = event.clientY - previous.y;
		this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

		if (this.activePointers.size >= 2) {
			const pinchDistance = this.getPinchDistance();
			if (pinchDistance !== null && this.lastPinchDistance !== null && this.lastPinchDistance > 0) {
				const scale = pinchDistance / this.lastPinchDistance;
				this.distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, this.distance / scale));
				this.lastPinchDistance = pinchDistance;
				this.updateCameraPosition();
			}
			return;
		}

		if (event.pointerId !== this.activePointerId) {
			return;
		}

		this.azimuth -= deltaX * ROTATE_SENSITIVITY;
		this.elevation = Math.max(
			0.1,
			Math.min(Math.PI / 2 - 0.05, this.elevation + deltaY * ROTATE_SENSITIVITY),
		);

		this.updateCameraPosition();
	}

	private onPointerUp(event: PointerEvent): void {
		event.preventDefault();

		this.activePointers.delete(event.pointerId);

		if (this.domElement.hasPointerCapture(event.pointerId)) {
			this.domElement.releasePointerCapture(event.pointerId);
		}

		if (this.activePointers.size < 2) {
			this.lastPinchDistance = null;
		}

		if (this.activePointers.size === 1) {
			const remaining = this.activePointers.entries().next().value;
			if (remaining) {
				const [pointerId] = remaining;
				this.activePointerId = pointerId;
			}
		} else {
			this.activePointerId = null;
		}

		if (this.activePointers.size === 0) {
			this.stopWindowListeners();
		}
	}

	private getPinchDistance(): number | null {
		const pointers = [...this.activePointers.values()];
		if (pointers.length < 2) {
			return null;
		}

		const dx = pointers[0].x - pointers[1].x;
		const dy = pointers[0].y - pointers[1].y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private onWheel(event: WheelEvent): void {
		event.preventDefault();
		this.distance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, this.distance + event.deltaY * 0.1));
		this.updateCameraPosition();
	}

	private updateCameraPosition(): void {
		const x = this.target.x + this.distance * Math.sin(this.azimuth) * Math.cos(this.elevation);
		const y = this.target.y + this.distance * Math.sin(this.elevation);
		const z = this.target.z + this.distance * Math.cos(this.azimuth) * Math.cos(this.elevation);

		this.camera.position.set(x, y, z);
		this.camera.lookAt(this.target);
	}
}
