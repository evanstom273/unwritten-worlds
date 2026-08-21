const JOYSTICK_DEADZONE = 0.12;

interface PointerPosition {
	x: number;
	y: number;
}

export class TouchInput {
	private root: HTMLElement | null = null;

	moveX = 0;
	moveZ = 0;
	lookX = 0;
	lookY = 0;
	jump = false;
	jumpPressed = false;
	sprint = false;
	crouch = false;
	primaryAction = false;
	secondaryAction = false;
	primaryActionPressed = false;
	secondaryActionPressed = false;
	flyTogglePressed = false;

	private joystickZone: HTMLElement | null = null;
	private joystickStick: HTMLElement | null = null;
	private lookZone: HTMLElement | null = null;
	private jumpButton: HTMLElement | null = null;
	private sprintButton: HTMLElement | null = null;
	private breakButton: HTMLElement | null = null;
	private placeButton: HTMLElement | null = null;
	private crouchButton: HTMLElement | null = null;
	private flyButton: HTMLElement | null = null;

	private joystickPointerId: number | null = null;
	private lookPointerId: number | null = null;
	private jumpPointerIds = new Set<number>();
	private sprintPointerIds = new Set<number>();
	private crouchPointerIds = new Set<number>();
	private breakPointerIds = new Set<number>();
	private placePointerIds = new Set<number>();
	private activePointers = new Map<number, PointerPosition>();
	private joystickCenter = { x: 0, y: 0 };
	private joystickRadius = 60;
	private isListeningOnWindow = false;

	private readonly boundPointerDown: (event: PointerEvent) => void;
	private readonly boundPointerMove: (event: PointerEvent) => void;
	private readonly boundPointerUp: (event: PointerEvent) => void;
	private readonly boundBlur: () => void;
	private readonly boundVisibilityChange: () => void;

	constructor() {
		this.boundPointerDown = (event) => {
			this.onPointerDown(event);
		};
		this.boundPointerMove = (event) => {
			this.onPointerMove(event);
		};
		this.boundPointerUp = (event) => {
			this.onPointerUp(event);
		};
		this.boundBlur = () => {
			this.reset();
		};
		this.boundVisibilityChange = () => {
			if (document.hidden) {
				this.reset();
			}
		};

		window.addEventListener('blur', this.boundBlur);
		document.addEventListener('visibilitychange', this.boundVisibilityChange);
	}

	attach(root: HTMLElement): void {
		this.detach();
		this.root = root;
		this.joystickZone = root.querySelector('[data-touch="joystick"]');
		this.joystickStick = root.querySelector('[data-touch="joystick-stick"]');
		this.lookZone = root.querySelector('[data-touch="look"]');
		this.jumpButton = root.querySelector('[data-touch="jump"]');
		this.sprintButton = root.querySelector('[data-touch="sprint"]');
		this.breakButton = root.querySelector('[data-touch="break"]');
		this.placeButton = root.querySelector('[data-touch="place"]');
		this.crouchButton = root.querySelector('[data-touch="crouch"]');
		this.flyButton = root.querySelector('[data-touch="fly"]');

		this.updateJoystickMetrics();
		root.addEventListener('pointerdown', this.boundPointerDown);
	}

	detach(): void {
		this.stopWindowListeners();
		if (this.root) {
			this.root.removeEventListener('pointerdown', this.boundPointerDown);
		}
		this.reset();
		this.root = null;
		this.joystickZone = null;
		this.joystickStick = null;
		this.lookZone = null;
		this.jumpButton = null;
		this.sprintButton = null;
		this.breakButton = null;
		this.placeButton = null;
		this.crouchButton = null;
		this.flyButton = null;
	}

	dispose(): void {
		this.detach();
		window.removeEventListener('blur', this.boundBlur);
		document.removeEventListener('visibilitychange', this.boundVisibilityChange);
	}

	onLayoutChange(): void {
		this.updateJoystickMetrics();
	}

	consumeLook(): { lookX: number; lookY: number } {
		const lookX = this.lookX;
		const lookY = this.lookY;
		this.lookX = 0;
		this.lookY = 0;
		return { lookX, lookY };
	}

	consumeEdgeActions(): void {
		this.jumpPressed = false;
		this.primaryActionPressed = false;
		this.secondaryActionPressed = false;
		this.flyTogglePressed = false;
	}

	reset(): void {
		this.moveX = 0;
		this.moveZ = 0;
		this.lookX = 0;
		this.lookY = 0;
		this.jump = false;
		this.jumpPressed = false;
		this.sprint = false;
		this.crouch = false;
		this.primaryAction = false;
		this.secondaryAction = false;
		this.consumeEdgeActions();

		this.joystickPointerId = null;
		this.lookPointerId = null;
		this.jumpPointerIds.clear();
		this.sprintPointerIds.clear();
		this.crouchPointerIds.clear();
		this.breakPointerIds.clear();
		this.placePointerIds.clear();
		this.activePointers.clear();
		this.resetJoystickVisual();
		this.stopWindowListeners();
	}

	private updateJoystickMetrics(): void {
		if (!this.joystickZone) {
			return;
		}

		const rect = this.joystickZone.getBoundingClientRect();
		this.joystickCenter = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};
		this.joystickRadius = Math.min(rect.width, rect.height) * 0.35;
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
		if (!this.root || event.pointerType === 'mouse') {
			return;
		}

		const target = event.target as Node;

		if (this.jumpButton?.contains(target)) {
			event.preventDefault();
			this.jumpPointerIds.add(event.pointerId);
			this.jump = true;
			this.jumpPressed = true;
			this.startWindowListeners();
			return;
		}

		if (this.breakButton?.contains(target)) {
			event.preventDefault();
			this.breakPointerIds.add(event.pointerId);
			this.primaryAction = true;
			this.primaryActionPressed = true;
			this.startWindowListeners();
			return;
		}

		if (this.placeButton?.contains(target)) {
			event.preventDefault();
			this.placePointerIds.add(event.pointerId);
			this.secondaryAction = true;
			this.secondaryActionPressed = true;
			this.startWindowListeners();
			return;
		}

		if (this.crouchButton?.contains(target)) {
			event.preventDefault();
			this.crouchPointerIds.add(event.pointerId);
			this.crouch = true;
			this.startWindowListeners();
			return;
		}

		if (this.flyButton?.contains(target)) {
			event.preventDefault();
			this.flyTogglePressed = true;
			this.startWindowListeners();
			return;
		}

		if (this.sprintButton?.contains(target)) {
			event.preventDefault();
			this.sprintPointerIds.add(event.pointerId);
			this.sprint = true;
			this.startWindowListeners();
			return;
		}

		if (this.joystickZone?.contains(target) && this.joystickPointerId === null) {
			event.preventDefault();
			this.joystickPointerId = event.pointerId;
			this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			this.updateJoystickMetrics();
			this.updateJoystick(event.clientX, event.clientY);
			this.startWindowListeners();
			return;
		}

		if (this.lookZone?.contains(target) && this.lookPointerId === null) {
			event.preventDefault();
			this.lookPointerId = event.pointerId;
			this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
			this.startWindowListeners();
		}
	}

	private onPointerMove(event: PointerEvent): void {
		if (event.pointerId === this.joystickPointerId) {
			event.preventDefault();
			this.updateJoystick(event.clientX, event.clientY);
			return;
		}

		if (event.pointerId === this.lookPointerId) {
			event.preventDefault();
			const previous = this.activePointers.get(event.pointerId);
			if (previous) {
				this.lookX += event.clientX - previous.x;
				this.lookY += event.clientY - previous.y;
			}
			this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		}
	}

	private onPointerUp(event: PointerEvent): void {
		if (this.jumpPointerIds.delete(event.pointerId)) {
			this.jump = this.jumpPointerIds.size > 0;
		}

		if (this.sprintPointerIds.delete(event.pointerId)) {
			this.sprint = this.sprintPointerIds.size > 0;
		}

		if (this.crouchPointerIds.delete(event.pointerId)) {
			this.crouch = this.crouchPointerIds.size > 0;
		}

		if (this.breakPointerIds.delete(event.pointerId)) {
			this.primaryAction = this.breakPointerIds.size > 0;
		}

		if (this.placePointerIds.delete(event.pointerId)) {
			this.secondaryAction = this.placePointerIds.size > 0;
		}

		if (event.pointerId === this.joystickPointerId) {
			this.joystickPointerId = null;
			this.moveX = 0;
			this.moveZ = 0;
			this.resetJoystickVisual();
		}

		if (event.pointerId === this.lookPointerId) {
			this.lookPointerId = null;
		}

		this.activePointers.delete(event.pointerId);

		if (
			this.joystickPointerId === null &&
			this.lookPointerId === null &&
			this.jumpPointerIds.size === 0 &&
			this.sprintPointerIds.size === 0 &&
			this.crouchPointerIds.size === 0 &&
			this.breakPointerIds.size === 0 &&
			this.placePointerIds.size === 0
		) {
			this.stopWindowListeners();
		}
	}

	private updateJoystick(clientX: number, clientY: number): void {
		const dx = clientX - this.joystickCenter.x;
		const dy = clientY - this.joystickCenter.y;
		const distance = Math.hypot(dx, dy);
		const clampedDistance = Math.min(distance, this.joystickRadius);
		const angle = Math.atan2(dy, dx);

		let normalizedX = 0;
		let normalizedZ = 0;

		if (distance > JOYSTICK_DEADZONE * this.joystickRadius) {
			normalizedX = (clampedDistance / this.joystickRadius) * Math.cos(angle);
			normalizedZ = -(clampedDistance / this.joystickRadius) * Math.sin(angle);
		}

		this.moveX = normalizedX;
		this.moveZ = normalizedZ;

		if (this.joystickStick) {
			const offsetX = normalizedX * this.joystickRadius;
			const offsetY = -normalizedZ * this.joystickRadius;
			this.joystickStick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
		}
	}

	private resetJoystickVisual(): void {
		if (this.joystickStick) {
			this.joystickStick.style.transform = 'translate(-50%, -50%)';
		}
	}
}
