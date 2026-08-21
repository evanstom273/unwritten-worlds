import type { BlockId } from './BlockId';
import { BlockId as Block } from './BlockId';
import { SECTION_SIZE } from './WorldConstants';

const SECTION_VOLUME = SECTION_SIZE * SECTION_SIZE * SECTION_SIZE;

export class ChunkSection {
	private readonly blocks: Uint8Array;

	constructor() {
		this.blocks = new Uint8Array(SECTION_VOLUME);
	}

	getBlock(localX: number, localY: number, localZ: number): BlockId {
		return this.blocks[this.toIndex(localX, localY, localZ)] as BlockId;
	}

	setBlock(localX: number, localY: number, localZ: number, blockId: BlockId): void {
		this.blocks[this.toIndex(localX, localY, localZ)] = blockId;
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
