export const BlockId = {
	AIR: 0,
	GRASS: 1,
	DIRT: 2,
	STONE: 3,
} as const;

export type BlockId = (typeof BlockId)[keyof typeof BlockId];

const BLOCK_COLORS: ReadonlyMap<BlockId, number> = new Map([
	[BlockId.GRASS, 0x4a8f3a],
	[BlockId.DIRT, 0x8b6914],
	[BlockId.STONE, 0x7a7a7a],
]);

export function isOpaqueBlock(blockId: BlockId): boolean {
	return blockId !== BlockId.AIR;
}

export function getBlockColor(blockId: BlockId): number {
	return BLOCK_COLORS.get(blockId) ?? 0xffffff;
}
