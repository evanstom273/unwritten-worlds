import { QuickEquipChannel } from '../equipment/QuickEquipChannel';
import {
	BREAK_HOLD_MS,
	EQUIP_LONG_PRESS_MS,
	TAP_MAX_DURATION_MS,
	TAP_MAX_MOVEMENT_PX,
} from '../config/TouchConfig';

const JOYSTICK_DEADZONE = 0.12;

interface PointerPosition {
	x: number;
	y: number;
}

interface EquipPressState {
	channel: QuickEquipChannel;
	startX: number;
	startY: number;
	startMs: number;
	longPressFired: boolean;
	moved: boolean;
	timerId: number;
}

interface WorldPressState {
	pointerId: number;
	startX: number;
	startY: number;
	startMs: number;
	moved: boolean;
	breakCompleted: boolean;
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
	primaryActionPressed = false;
	secondaryActionPressed = false;
	touchActionScreenX: number | null = null;
	touchActionScreenY: number | null = null;

	cycleTop = false;
	cycleLeftHand = false;
	cycleRightHand = false;
	cycleUtility = false;
	resetTop = false;
	resetLeftHand = false;
	resetRightHand = false;
	resetUtility = false;

	private joystickZone: HTMLElement | null = null;
	private joystickStick: HTMLElement | null = null;
	private lookZone: HTMLElement | null = null;
	private jumpButton: HTMLElement | null = null;
	private sprintButton: HTMLElement | null = null;
	private crouchButton: HTMLElement | null = null;

	private joystickPointerId: number | null = null;
	private lookPointerId: number | null = null;
	private jumpPointerIds = new Set<number>();
	private sprintPointerIds = new Set<number>();
	private crouchPointerIds = new Set<number>();
	private activePointers = new Map<number, PointerPosition>();
	private equipPressByPointerId = new Map<number, EquipPressState>();
	private worldPress: WorldPressState | null = null;
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
		this.crouchButton = root.querySelector('[data-touch="crouch"]');

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
		this.crouchButton = null;
	}

	dispose(): void {
		this.detach();
		window.removeEventListener('blur', this.boundBlur);
		document.removeEventListener('visibilitychange', this.boundVisibilityChange);
	}

	onLayoutChange(): void {
		this.updateJoystickMetrics();
	}

	updateInteractionTimers(nowMs: number): void {
		if (!this.worldPress || this.worldPress.moved || this.worldPress.breakCompleted) {
			return;
		}

		if (nowMs - this.worldPress.startMs >= BREAK_HOLD_MS) {
			this.worldPress.breakCompleted = true;
			this.touchActionScreenX = this.worldPress.startX;
			this.touchActionScreenY = this.worldPress.startY;
			this.primaryActionPressed = true;
		}
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
		this.touchActionScreenX = null;
		this.touchActionScreenY = null;
		this.cycleTop = false;
		this.cycleLeftHand = false;
		this.cycleRightHand = false;
		this.cycleUtility = false;
		this.resetTop = false;
		this.resetLeftHand = false;
		this.resetRightHand = false;
		this.resetUtility = false;
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
		this.consumeEdgeActions();

		this.clearEquipPresses();
		this.worldPress = null;

		this.joystickPointerId = null;
		this.lookPointerId = null;
		this.jumpPointerIds.clear();
		this.sprintPointerIds.clear();
		this.crouchPointerIds.clear();
		this.activePointers.clear();
		this.resetJoystickVisual();
		this.stopWindowListeners();
	}

	private clearEquipPresses(): void {
		for (const state of this.equipPressByPointerId.values()) {
			window.clearTimeout(state.timerId);
		}
		this.equipPressByPointerId.clear();
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
		if (!this.root) {
			return;
		}

		const isTouchPointer =
			event.pointerType === 'touch' || event.pointerType === 'pen';
		if (!isTouchPointer) {
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

		if (this.crouchButton?.contains(target)) {
			event.preventDefault();
			this.crouchPointerIds.add(event.pointerId);
			this.crouch = true;
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

		const equipChannel = this.getEquipChannelForTarget(target);
		if (equipChannel !== null) {
			event.preventDefault();
			this.beginEquipPress(event.pointerId, equipChannel, event.clientX, event.clientY);
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
			this.worldPress = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				startMs: performance.now(),
				moved: false,
				breakCompleted: false,
			};
			this.startWindowListeners();
		}
	}

	private onPointerMove(event: PointerEvent): void {
		if (event.pointerId === this.joystickPointerId) {
			event.preventDefault();
			this.updateJoystick(event.clientX, event.clientY);
			return;
		}

		const equipPress = this.equipPressByPointerId.get(event.pointerId);
		if (equipPress && !equipPress.longPressFired) {
			const dx = event.clientX - equipPress.startX;
			const dy = event.clientY - equipPress.startY;
			if (Math.hypot(dx, dy) > TAP_MAX_MOVEMENT_PX) {
				equipPress.moved = true;
				window.clearTimeout(equipPress.timerId);
			}
		}

		if (event.pointerId === this.lookPointerId) {
			event.preventDefault();
			const previous = this.activePointers.get(event.pointerId);
			if (previous) {
				this.lookX += event.clientX - previous.x;
				this.lookY += event.clientY - previous.y;
			}
			this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

			if (this.worldPress?.pointerId === event.pointerId && !this.worldPress.moved) {
				const dx = event.clientX - this.worldPress.startX;
				const dy = event.clientY - this.worldPress.startY;
				if (Math.hypot(dx, dy) > TAP_MAX_MOVEMENT_PX) {
					this.worldPress.moved = true;
				}
			}
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

		if (this.equipPressByPointerId.has(event.pointerId)) {
			this.finishEquipPress(event.pointerId);
		}

		if (this.worldPress?.pointerId === event.pointerId) {
			this.finishWorldPress();
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
			this.equipPressByPointerId.size === 0
		) {
			this.stopWindowListeners();
		}
	}

	private getEquipChannelForTarget(target: Node): QuickEquipChannel | null {
		if (!(target instanceof Element)) {
			return null;
		}

		const touchTarget = target.closest('[data-touch]');
		if (!touchTarget) {
			return null;
		}

		switch (touchTarget.getAttribute('data-touch')) {
			case 'equip-top':
				return QuickEquipChannel.TOP;
			case 'equip-left':
				return QuickEquipChannel.LEFT_HAND;
			case 'equip-right':
				return QuickEquipChannel.RIGHT_HAND;
			case 'equip-utility':
				return QuickEquipChannel.UTILITY;
			default:
				return null;
		}
	}

	private beginEquipPress(
		pointerId: number,
		channel: QuickEquipChannel,
		clientX: number,
		clientY: number,
	): void {
		const startMs = performance.now();
		const timerId = window.setTimeout(() => {
			const state = this.equipPressByPointerId.get(pointerId);
			if (!state || state.longPressFired || state.moved) {
				return;
			}

			state.longPressFired = true;
			this.fireEquipReset(state.channel);
		}, EQUIP_LONG_PRESS_MS);

		this.equipPressByPointerId.set(pointerId, {
			channel,
			startX: clientX,
			startY: clientY,
			startMs,
			longPressFired: false,
			moved: false,
			timerId,
		});
	}

	private finishEquipPress(pointerId: number): void {
		const state = this.equipPressByPointerId.get(pointerId);
		if (!state) {
			return;
		}

		window.clearTimeout(state.timerId);
		this.equipPressByPointerId.delete(pointerId);

		if (state.longPressFired) {
			return;
		}

		this.fireEquipCycle(state.channel);
	}

	private fireEquipCycle(channel: QuickEquipChannel): void {
		switch (channel) {
			case QuickEquipChannel.TOP:
				this.cycleTop = true;
				break;
			case QuickEquipChannel.LEFT_HAND:
				this.cycleLeftHand = true;
				break;
			case QuickEquipChannel.RIGHT_HAND:
				this.cycleRightHand = true;
				break;
			case QuickEquipChannel.UTILITY:
				this.cycleUtility = true;
				break;
		}
	}

	private fireEquipReset(channel: QuickEquipChannel): void {
		switch (channel) {
			case QuickEquipChannel.TOP:
				this.resetTop = true;
				break;
			case QuickEquipChannel.LEFT_HAND:
				this.resetLeftHand = true;
				break;
			case QuickEquipChannel.RIGHT_HAND:
				this.resetRightHand = true;
				break;
			case QuickEquipChannel.UTILITY:
				this.resetUtility = true;
				break;
		}
	}

	private finishWorldPress(): void {
		const press = this.worldPress;
		if (!press) {
			return;
		}

		const duration = performance.now() - press.startMs;
		if (
			!press.moved &&
			!press.breakCompleted &&
			duration <= TAP_MAX_DURATION_MS
		) {
			this.touchActionScreenX = press.startX;
			this.touchActionScreenY = press.startY;
			this.secondaryActionPressed = true;
		}

		this.worldPress = null;
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
