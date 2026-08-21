export interface InputState {
	moveX: number;
	moveZ: number;
	lookX: number;
	lookY: number;
	jump: boolean;
	sprint: boolean;
	crouch: boolean;
	jumpPressed: boolean;
	primaryAction: boolean;
	secondaryAction: boolean;
	primaryActionPressed: boolean;
	secondaryActionPressed: boolean;
	flyTogglePressed: boolean;
	cycleTop: boolean;
	cycleLeftHand: boolean;
	cycleRightHand: boolean;
	cycleUtility: boolean;
	resetTop: boolean;
	resetLeftHand: boolean;
	resetRightHand: boolean;
	resetUtility: boolean;
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
		crouch: false,
		jumpPressed: false,
		primaryAction: false,
		secondaryAction: false,
		primaryActionPressed: false,
		secondaryActionPressed: false,
		flyTogglePressed: false,
		cycleTop: false,
		cycleLeftHand: false,
		cycleRightHand: false,
		cycleUtility: false,
		resetTop: false,
		resetLeftHand: false,
		resetRightHand: false,
		resetUtility: false,
	};
}
