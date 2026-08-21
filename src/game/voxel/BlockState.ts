export const LogAxis = {
	Y: 1,
	X: 2,
	Z: 3,
} as const;

export type LogAxis = (typeof LogAxis)[keyof typeof LogAxis];

export type BlockState = number;

export const DEFAULT_BLOCK_STATE: BlockState = 0;

export function logAxisFromPlacementNormal(
	normalX: number,
	normalY: number,
	_normalZ: number,
): LogAxis {
	if (normalY !== 0) {
		return LogAxis.Y;
	}
	if (normalX !== 0) {
		return LogAxis.X;
	}
	return LogAxis.Z;
}

export function isLogAxis(state: BlockState): state is LogAxis {
	return state === LogAxis.X || state === LogAxis.Y || state === LogAxis.Z;
}
