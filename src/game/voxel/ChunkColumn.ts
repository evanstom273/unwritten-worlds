import type { BlockId } from './BlockId';
import type { BlockState } from './BlockState';
import { DEFAULT_BLOCK_STATE } from './BlockState';
import { ChunkSection } from './ChunkSection';
import { SECTION_SIZE } from './WorldConstants';

export class ChunkColumn {
	readonly chunkX: number;
	readonly chunkZ: number;
	private readonly sections: Map<number, ChunkSection> = new Map();

	constructor(chunkX: number, chunkZ: number) {
		this.chunkX = chunkX;
		this.chunkZ = chunkZ;
	}

	getSection(sectionY: number): ChunkSection | undefined {
		return this.sections.get(sectionY);
	}

	getOrCreateSection(sectionY: number): ChunkSection {
		let section = this.sections.get(sectionY);
		if (!section) {
			section = new ChunkSection();
			this.sections.set(sectionY, section);
		}
		return section;
	}

	getBlock(localX: number, worldY: number, localZ: number): BlockId {
		const sectionY = Math.floor(worldY / SECTION_SIZE);
		const section = this.sections.get(sectionY);
		if (!section) {
			return 0;
		}

		const localY = worldY - sectionY * SECTION_SIZE;
		return section.getBlock(localX, localY, localZ);
	}

	getBlockState(localX: number, worldY: number, localZ: number): BlockState {
		const sectionY = Math.floor(worldY / SECTION_SIZE);
		const section = this.sections.get(sectionY);
		if (!section) {
			return DEFAULT_BLOCK_STATE;
		}

		const localY = worldY - sectionY * SECTION_SIZE;
		return section.getBlockState(localX, localY, localZ);
	}

	setBlock(
		localX: number,
		worldY: number,
		localZ: number,
		blockId: BlockId,
		blockState: BlockState = DEFAULT_BLOCK_STATE,
	): void {
		const sectionY = Math.floor(worldY / SECTION_SIZE);
		const localY = worldY - sectionY * SECTION_SIZE;
		const section = this.getOrCreateSection(sectionY);
		section.setBlock(localX, localY, localZ, blockId, blockState);
	}

	getSectionCount(): number {
		return this.sections.size;
	}

	getSectionIndices(): number[] {
		return [...this.sections.keys()];
	}
}
