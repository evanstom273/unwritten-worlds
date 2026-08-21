import { BlockId } from './BlockId';
import { ChunkColumn } from './ChunkColumn';
import {
	CHUNK_SIZE,
	CHUNKS_X,
	CHUNKS_Z,
	WORLD_DEPTH,
	WORLD_MAX_Y,
	WORLD_MIN_Y,
	WORLD_WIDTH,
} from './WorldConstants';

const GROUND_Y = 64;
const DIRT_LAYERS = 3;
const STONE_TOP_Y = GROUND_Y - DIRT_LAYERS;

export class World {
	private readonly columns: Map<number, ChunkColumn> = new Map();

	constructor() {
		this.generateFlatTerrain();
	}

	getBlock(worldX: number, worldY: number, worldZ: number): BlockId {
		if (!this.isInBounds(worldX, worldY, worldZ)) {
			return BlockId.AIR;
		}

		const chunkX = Math.floor(worldX / CHUNK_SIZE);
		const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
		const column = this.columns.get(this.columnKey(chunkX, chunkZ));
		if (!column) {
			return BlockId.AIR;
		}

		const localX = worldX - chunkX * CHUNK_SIZE;
		const localZ = worldZ - chunkZ * CHUNK_SIZE;
		return column.getBlock(localX, worldY, localZ);
	}

	getChunkColumn(chunkX: number, chunkZ: number): ChunkColumn | undefined {
		return this.columns.get(this.columnKey(chunkX, chunkZ));
	}

	getChunkColumns(): ChunkColumn[] {
		return [...this.columns.values()];
	}

	getChunkColumnCount(): number {
		return this.columns.size;
	}

	getAllocatedSectionCount(): number {
		let count = 0;
		for (const column of this.columns.values()) {
			count += column.getSectionCount();
		}
		return count;
	}

	isInBounds(worldX: number, worldY: number, worldZ: number): boolean {
		return (
			worldX >= 0 &&
			worldX < WORLD_WIDTH &&
			worldZ >= 0 &&
			worldZ < WORLD_DEPTH &&
			worldY >= WORLD_MIN_Y &&
			worldY <= WORLD_MAX_Y
		);
	}

	private generateFlatTerrain(): void {
		for (let chunkZ = 0; chunkZ < CHUNKS_Z; chunkZ++) {
			for (let chunkX = 0; chunkX < CHUNKS_X; chunkX++) {
				const column = new ChunkColumn(chunkX, chunkZ);
				this.columns.set(this.columnKey(chunkX, chunkZ), column);

				for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
					for (let localX = 0; localX < CHUNK_SIZE; localX++) {
						for (let y = 0; y <= GROUND_Y; y++) {
							let blockId: BlockId;
							if (y === GROUND_Y) {
								blockId = BlockId.GRASS;
							} else if (y > STONE_TOP_Y) {
								blockId = BlockId.DIRT;
							} else {
								blockId = BlockId.STONE;
							}

							column.setBlock(localX, y, localZ, blockId);
						}
					}
				}
			}
		}
	}

	private columnKey(chunkX: number, chunkZ: number): number {
		return chunkX + chunkZ * CHUNKS_X;
	}
}
