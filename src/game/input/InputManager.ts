import { detectPrimaryInputMode } from './InputCapabilities';
import { KeyboardMouseInput } from './KeyboardMouseInput';
import { createEmptyInputState, type InputMode, type InputState } from './InputState';
import { TouchInput } from './TouchInput';

export class InputManager {
	private readonly keyboardMouse: KeyboardMouseInput;
	private readonly touch: TouchInput;
	private readonly state: InputState = createEmptyInputState();
	private readonly inputMode: InputMode;

	constructor(canvas: HTMLElement) {
		this.inputMode = detectPrimaryInputMode();
		this.keyboardMouse = new KeyboardMouseInput(canvas);
		this.touch = new TouchInput();
	}

	getInputMode(): InputMode {
		return this.inputMode;
	}

	isPointerLocked(): boolean {
		return this.keyboardMouse.pointerLocked;
	}

	setPointerLockCallback(callback: (locked: boolean) => void): void {
		this.keyboardMouse.setPointerLockChangeCallback(callback);
	}

	attachTouchControls(root: HTMLElement): void {
		this.touch.attach(root);
	}

	detachTouchControls(): void {
		this.touch.detach();
	}

	onLayoutChange(): void {
		this.touch.onLayoutChange();
	}

	poll(): InputState {
		this.keyboardMouse.updateMovementFromKeys();

		if (this.inputMode === 'touch') {
			this.state.moveX = this.touch.moveX;
			this.state.moveZ = this.touch.moveZ;
			this.state.jump = this.touch.jump;
			this.state.jumpPressed = this.touch.jumpPressed;
			this.state.sprint = this.touch.sprint;
			this.state.crouch = this.touch.crouch;
			this.state.primaryAction = this.touch.primaryAction;
			this.state.secondaryAction = this.touch.secondaryAction;
			this.state.primaryActionPressed = this.touch.primaryActionPressed;
			this.state.secondaryActionPressed = this.touch.secondaryActionPressed;
			this.state.flyTogglePressed = this.touch.flyTogglePressed;

			const touchLook = this.touch.consumeLook();
			this.state.lookX = touchLook.lookX;
			this.state.lookY = touchLook.lookY;
		} else {
			this.state.moveX = this.keyboardMouse.moveX;
			this.state.moveZ = this.keyboardMouse.moveZ;
			this.state.jump = this.keyboardMouse.jump;
			this.state.jumpPressed = this.keyboardMouse.jumpPressed;
			this.state.sprint = this.keyboardMouse.sprint;
			this.state.crouch = this.keyboardMouse.crouch;
			this.state.primaryAction = this.keyboardMouse.primaryAction;
			this.state.secondaryAction = this.keyboardMouse.secondaryAction;
			this.state.primaryActionPressed = this.keyboardMouse.primaryActionPressed;
			this.state.secondaryActionPressed = this.keyboardMouse.secondaryActionPressed;
			this.state.flyTogglePressed = this.keyboardMouse.flyTogglePressed;
			this.state.cycleTop = this.keyboardMouse.cycleTop;
			this.state.cycleLeftHand = this.keyboardMouse.cycleLeftHand;
			this.state.cycleRightHand = this.keyboardMouse.cycleRightHand;
			this.state.cycleUtility = this.keyboardMouse.cycleUtility;

			const mouseLook = this.keyboardMouse.consumeLook();
			this.state.lookX = this.keyboardMouse.pointerLocked ? mouseLook.lookX : 0;
			this.state.lookY = this.keyboardMouse.pointerLocked ? mouseLook.lookY : 0;
		}

		return this.state;
	}

	consumeEdgeActions(): void {
		this.keyboardMouse.consumeEdgeActions();
		this.touch.consumeEdgeActions();
	}

	resetAll(): void {
		this.keyboardMouse.reset();
		this.touch.reset();
	}

	dispose(): void {
		this.keyboardMouse.dispose();
		this.touch.dispose();
	}
}
