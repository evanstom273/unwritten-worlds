export interface InputState {
	moveX: number;
	moveZ: number;
	lookX: number;
	lookY: number;
	jump: boolean;
	sprint: boolean;
	primaryAction: boolean;
	secondaryAction: boolean;
}

export type InputMode = 'keyboard-mouse' | 'touch';

export function createEmptyInputState(): InputState {
	return {
		moveX: 0,
		moveZ: 0,
		lookX: 0,
		lookY: 0,
		jump: false,
		sprint: false,
		primaryAction: false,
		secondaryAction: false,
	};
}
