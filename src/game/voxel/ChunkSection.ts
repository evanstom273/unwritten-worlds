import type { BlockId } from './BlockId';
import { BlockId as Block } from './BlockId';
import type { BlockState } from './BlockState';
import { DEFAULT_BLOCK_STATE } from './BlockState';
import { SECTION_SIZE } from './WorldConstants';

const SECTION_VOLUME = SECTION_SIZE * SECTION_SIZE * SECTION_SIZE;

export class ChunkSection {
	private readonly blocks: Uint8Array;
	private readonly states: Uint8Array;

	constructor() {
		this.blocks = new Uint8Array(SECTION_VOLUME);
		this.states = new Uint8Array(SECTION_VOLUME);
	}

	getBlock(localX: number, localY: number, localZ: number): BlockId {
		return this.blocks[this.toIndex(localX, localY, localZ)] as BlockId;
	}

	getBlockState(localX: number, localY: number, localZ: number): BlockState {
		return this.states[this.toIndex(localX, localY, localZ)];
	}

	setBlock(
		localX: number,
		localY: number,
		localZ: number,
		blockId: BlockId,
		blockState: BlockState = DEFAULT_BLOCK_STATE,
	): void {
		const index = this.toIndex(localX, localY, localZ);
		this.blocks[index] = blockId;
		this.states[index] = blockId === Block.AIR ? DEFAULT_BLOCK_STATE : blockState;
	}

	isEmpty(): boolean {
		for (let index = 0; index < SECTION_VOLUME; index++) {
			if (this.blocks[index] !== Block.AIR) {
				return false;
			}
		}
		return true;
	}

	private toIndex(localX: number, localY: number, localZ: number): number {
		return localX + localZ * SECTION_SIZE + localY * SECTION_SIZE * SECTION_SIZE;
	}
}
