export class KeyboardMouseInput {
	private readonly canvas: HTMLElement;
	private readonly keysDown = new Set<string>();

	lookX = 0;
	lookY = 0;
	moveX = 0;
	moveZ = 0;
	jump = false;
	sprint = false;
	primaryAction = false;
	secondaryAction = false;

	pointerLocked = false;

	private pointerLockChangeCallback: ((locked: boolean) => void) | null = null;

	private readonly boundKeyDown: (event: KeyboardEvent) => void;
	private readonly boundKeyUp: (event: KeyboardEvent) => void;
	private readonly boundMouseMove: (event: MouseEvent) => void;
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

	updateMovementFromKeys(): void {
		let moveX = 0;
		let moveZ = 0;

		if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) {
			moveZ += 1;
		}
		if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) {
			moveZ -= 1;
		}
		if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) {
			moveX += 1;
		}
		if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) {
			moveX -= 1;
		}

		this.moveX = moveX;
		this.moveZ = moveZ;
		this.jump = this.keysDown.has('Space');
		this.sprint = this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
	}

	reset(): void {
		this.keysDown.clear();
		this.lookX = 0;
		this.lookY = 0;
		this.moveX = 0;
		this.moveZ = 0;
		this.jump = false;
		this.sprint = false;
		this.primaryAction = false;
		this.secondaryAction = false;
	}

	private onKeyDown(event: KeyboardEvent): void {
		this.keysDown.add(event.code);
		this.updateMovementFromKeys();

		if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
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
