export const BlockFace = {
	UP: 'UP',
	DOWN: 'DOWN',
	NORTH: 'NORTH',
	SOUTH: 'SOUTH',
	EAST: 'EAST',
	WEST: 'WEST',
} as const;

export type BlockFace = (typeof BlockFace)[keyof typeof BlockFace];

export function blockFaceFromNormal(normalX: number, normalY: number, normalZ: number): BlockFace {
	if (normalY === 1) {
		return BlockFace.UP;
	}
	if (normalY === -1) {
		return BlockFace.DOWN;
	}
	if (normalX === 1) {
		return BlockFace.EAST;
	}
	if (normalX === -1) {
		return BlockFace.WEST;
	}
	if (normalZ === 1) {
		return BlockFace.SOUTH;
	}
	return BlockFace.NORTH;
}
