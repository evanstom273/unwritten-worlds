export const BlockId = {
	AIR: 0,
	GRASS: 1,
	DIRT: 2,
	STONE: 3,
	PLANKS: 4,
	GLASS: 5,
	LOG: 6,
} as const;

export type BlockId = (typeof BlockId)[keyof typeof BlockId];

export function isSolidBlock(blockId: BlockId): boolean {
	return blockId !== BlockId.AIR;
}

export function isOpaqueBlock(blockId: BlockId): boolean {
	return blockId !== BlockId.AIR && blockId !== BlockId.GLASS;
}

export function isReplaceableBlock(blockId: BlockId): boolean {
	return blockId === BlockId.AIR;
}
