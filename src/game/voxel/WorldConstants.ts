export const WORLD_WIDTH = 256;
export const WORLD_DEPTH = 256;
export const WORLD_MIN_Y = 0;
export const WORLD_MAX_Y = 1023;
export const WORLD_HEIGHT = WORLD_MAX_Y - WORLD_MIN_Y + 1;

export const CHUNK_SIZE = 16;
export const SECTION_SIZE = 16;

export const CHUNKS_X = WORLD_WIDTH / CHUNK_SIZE;
export const CHUNKS_Z = WORLD_DEPTH / CHUNK_SIZE;
export const SECTIONS_PER_COLUMN = Math.ceil(WORLD_HEIGHT / SECTION_SIZE);

export const CHUNK_COLUMN_COUNT = CHUNKS_X * CHUNKS_Z;
