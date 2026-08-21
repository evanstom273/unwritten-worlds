export class KeyboardMouseInput {
	private readonly canvas: HTMLElement;
	private readonly keysDown = new Set<string>();

	lookX = 0;
	lookY = 0;
	moveX = 0;
	moveZ = 0;
	jump = false;
	jumpPressed = false;
	sprint = false;
	crouch = false;
	primaryAction = false;
	secondaryAction = false;
	primaryActionPressed = false;
	secondaryActionPressed = false;
	flyTogglePressed = false;
	cycleTop = false;
	cycleLeftHand = false;
	cycleRightHand = false;
	cycleUtility = false;

	pointerLocked = false;

	private pointerLockChangeCallback: ((locked: boolean) => void) | null = null;

	private readonly boundKeyDown: (event: KeyboardEvent) => void;
	private readonly boundKeyUp: (event: KeyboardEvent) => void;
	private readonly boundMouseMove: (event: MouseEvent) => void;
	private readonly boundMouseDown: (event: MouseEvent) => void;
	private readonly boundMouseUp: (event: MouseEvent) => void;
	private readonly boundPointerLockChange: () => void;
	private readonly boundBlur: () => void;
	private readonly boundVisibilityChange: () => void;
	private readonly boundCanvasClick: () => void;

	constructor(canvas: HTMLElement) {
		this.canvas = canvas;

		this.boundKeyDown = (event) => {
			this.onKeyDown(event);
		};
		this.boundKeyUp = (event) => {
			this.onKeyUp(event);
		};
		this.boundMouseMove = (event) => {
			this.onMouseMove(event);
		};
		this.boundMouseDown = (event) => {
			this.onMouseDown(event);
		};
		this.boundMouseUp = (event) => {
			this.onMouseUp(event);
		};
		this.boundPointerLockChange = () => {
			this.onPointerLockChange();
		};
		this.boundBlur = () => {
			this.reset();
		};
		this.boundVisibilityChange = () => {
			if (document.hidden) {
				this.reset();
			}
		};
		this.boundCanvasClick = () => {
			this.requestPointerLock();
		};

		window.addEventListener('keydown', this.boundKeyDown);
		window.addEventListener('keyup', this.boundKeyUp);
		document.addEventListener('mousemove', this.boundMouseMove);
		document.addEventListener('mousedown', this.boundMouseDown);
		document.addEventListener('mouseup', this.boundMouseUp);
		document.addEventListener('pointerlockchange', this.boundPointerLockChange);
		window.addEventListener('blur', this.boundBlur);
		document.addEventListener('visibilitychange', this.boundVisibilityChange);
		canvas.addEventListener('click', this.boundCanvasClick);
	}

	setPointerLockChangeCallback(callback: (locked: boolean) => void): void {
		this.pointerLockChangeCallback = callback;
		callback(this.pointerLocked);
	}

	dispose(): void {
		window.removeEventListener('keydown', this.boundKeyDown);
		window.removeEventListener('keyup', this.boundKeyUp);
		document.removeEventListener('mousemove', this.boundMouseMove);
		document.removeEventListener('mousedown', this.boundMouseDown);
		document.removeEventListener('mouseup', this.boundMouseUp);
		document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
		window.removeEventListener('blur', this.boundBlur);
		document.removeEventListener('visibilitychange', this.boundVisibilityChange);
		this.canvas.removeEventListener('click', this.boundCanvasClick);

		if (document.pointerLockElement === this.canvas) {
			document.exitPointerLock();
		}
	}

	requestPointerLock(): void {
		if (document.pointerLockElement !== this.canvas) {
			this.canvas.requestPointerLock();
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
		this.flyTogglePressed = false;
		this.cycleTop = false;
		this.cycleLeftHand = false;
		this.cycleRightHand = false;
		this.cycleUtility = false;
	}

	updateMovementFromKeys(): void {
		let moveX = 0;
		let moveZ = 0;

		if (this.keysDown.has('KeyW')) {
			moveZ += 1;
		}
		if (this.keysDown.has('KeyS')) {
			moveZ -= 1;
		}
		if (this.keysDown.has('KeyD')) {
			moveX += 1;
		}
		if (this.keysDown.has('KeyA')) {
			moveX -= 1;
		}

		this.moveX = moveX;
		this.moveZ = moveZ;
		this.jump = this.keysDown.has('Space');
		this.sprint = this.keysDown.has('ControlLeft') || this.keysDown.has('ControlRight');
		this.crouch = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
	}

	reset(): void {
		this.keysDown.clear();
		this.lookX = 0;
		this.lookY = 0;
		this.moveX = 0;
		this.moveZ = 0;
		this.jump = false;
		this.jumpPressed = false;
		this.sprint = false;
		this.crouch = false;
		this.primaryAction = false;
		this.secondaryAction = false;
		this.consumeEdgeActions();
	}

	private onKeyDown(event: KeyboardEvent): void {
		if (event.code === 'ArrowLeft' && !event.repeat) {
			this.cycleLeftHand = true;
			event.preventDefault();
			return;
		}
		if (event.code === 'ArrowRight' && !event.repeat) {
			this.cycleRightHand = true;
			event.preventDefault();
			return;
		}
		if (event.code === 'ArrowUp' && !event.repeat) {
			this.cycleTop = true;
			event.preventDefault();
			return;
		}
		if (event.code === 'ArrowDown' && !event.repeat) {
			this.cycleUtility = true;
			event.preventDefault();
			return;
		}

		if (event.code === 'Space' && !event.repeat) {
			this.jumpPressed = true;
		}

		this.keysDown.add(event.code);
		this.updateMovementFromKeys();

		if (['Space', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
			event.preventDefault();
		}
	}

	private onKeyUp(event: KeyboardEvent): void {
		this.keysDown.delete(event.code);
		this.updateMovementFromKeys();
	}

	private onMouseMove(event: MouseEvent): void {
		if (document.pointerLockElement !== this.canvas) {
			return;
		}

		this.lookX += event.movementX;
		this.lookY += event.movementY;
	}

	private onMouseDown(event: MouseEvent): void {
		if (document.pointerLockElement !== this.canvas) {
			return;
		}

		if (event.button === 0) {
			this.primaryAction = true;
			this.primaryActionPressed = true;
		} else if (event.button === 2) {
			this.secondaryAction = true;
			this.secondaryActionPressed = true;
		}
	}

	private onMouseUp(event: MouseEvent): void {
		if (event.button === 0) {
			this.primaryAction = false;
		} else if (event.button === 2) {
			this.secondaryAction = false;
		}
	}

	private onPointerLockChange(): void {
		this.pointerLocked = document.pointerLockElement === this.canvas;
		if (!this.pointerLocked) {
			this.reset();
		}
		if (this.pointerLockChangeCallback) {
			this.pointerLockChangeCallback(this.pointerLocked);
		}
	}
}
