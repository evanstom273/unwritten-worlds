export const BlockId = {
	AIR: 0,
	GRASS: 1,
	DIRT: 2,
	STONE: 3,
} as const;

export type BlockId = (typeof BlockId)[keyof typeof BlockId];

export function isOpaqueBlock(blockId: BlockId): boolean {
	return blockId !== BlockId.AIR;
}
