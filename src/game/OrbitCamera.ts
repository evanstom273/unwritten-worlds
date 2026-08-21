import * as THREE from 'three';
import { WORLD_DEPTH, WORLD_WIDTH } from './voxel/WorldConstants';

export class OrbitCamera {
	private readonly camera: THREE.PerspectiveCamera;
	private readonly target: THREE.Vector3;
	private readonly domElement: HTMLElement;

	private azimuth = Math.PI * 0.25;
	private elevation = Math.PI * 0.3;
	private distance = 200;

	private isDragging = false;
	private lastPointerX = 0;
	private lastPointerY = 0;
	private activePointerId: number | null = null;
	private lastPinchDistance: number | null = null;
	private activePointers: Map<number, { x: number; y: number }> = new Map();

	private readonly boundPointerDown: (event: PointerEvent) => void;
	private readonly boundPointerMove: (event: PointerEvent) => void;
	private readonly boundPointerUp: (event: PointerEvent) => void;
	private readonly boundWheel: (event: WheelEvent) => void;

	constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
		this.camera = camera;
		this.domElement = domElement;
		this.target = new THREE.Vector3(WORLD_WIDTH / 2, 32, WORLD_DEPTH / 2);

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
		domElement.addEventListener('pointermove', this.boundPointerMove);
		domElement.addEventListener('pointerup', this.boundPointerUp);
		domElement.addEventListener('pointercancel', this.boundPointerUp);
		domElement.addEventListener('wheel', this.boundWheel, { passive: false });

		this.updateCameraPosition();
	}

	update(): void {
		this.updateCameraPosition();
	}

	dispose(): void {
		this.domElement.removeEventListener('pointerdown', this.boundPointerDown);
		this.domElement.removeEventListener('pointermove', this.boundPointerMove);
		this.domElement.removeEventListener('pointerup', this.boundPointerUp);
		this.domElement.removeEventListener('pointercancel', this.boundPointerUp);
		this.domElement.removeEventListener('wheel', this.boundWheel);
	}

	private onPointerDown(event: PointerEvent): void {
		this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		this.domElement.setPointerCapture(event.pointerId);

		if (this.activePointers.size === 1) {
			this.isDragging = true;
			this.activePointerId = event.pointerId;
			this.lastPointerX = event.clientX;
			this.lastPointerY = event.clientY;
		} else if (this.activePointers.size === 2) {
			this.isDragging = false;
			this.lastPinchDistance = this.getPinchDistance();
		}
	}

	private onPointerMove(event: PointerEvent): void {
		if (!this.activePointers.has(event.pointerId)) {
			return;
		}

		this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

		if (this.activePointers.size >= 2) {
			const pinchDistance = this.getPinchDistance();
			if (pinchDistance !== null && this.lastPinchDistance !== null) {
				const scale = pinchDistance / this.lastPinchDistance;
				this.distance = Math.max(30, Math.min(500, this.distance / scale));
				this.lastPinchDistance = pinchDistance;
				this.updateCameraPosition();
			}
			return;
		}

		if (!this.isDragging || event.pointerId !== this.activePointerId) {
			return;
		}

		const deltaX = event.clientX - this.lastPointerX;
		const deltaY = event.clientY - this.lastPointerY;
		this.lastPointerX = event.clientX;
		this.lastPointerY = event.clientY;

		this.azimuth -= deltaX * 0.005;
		this.elevation = Math.max(
			0.1,
			Math.min(Math.PI / 2 - 0.05, this.elevation + deltaY * 0.005),
		);

		this.updateCameraPosition();
	}

	private onPointerUp(event: PointerEvent): void {
		this.activePointers.delete(event.pointerId);

		if (this.activePointers.size < 2) {
			this.lastPinchDistance = null;
		}

		if (this.activePointers.size === 1) {
			const remaining = this.activePointers.entries().next().value;
			if (remaining) {
				const [pointerId, position] = remaining;
				this.isDragging = true;
				this.activePointerId = pointerId;
				this.lastPointerX = position.x;
				this.lastPointerY = position.y;
			}
		}

		if (event.pointerId === this.activePointerId) {
			this.isDragging = false;
			this.activePointerId = null;
		}

		if (this.domElement.hasPointerCapture(event.pointerId)) {
			this.domElement.releasePointerCapture(event.pointerId);
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
		this.distance = Math.max(30, Math.min(500, this.distance + event.deltaY * 0.1));
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
