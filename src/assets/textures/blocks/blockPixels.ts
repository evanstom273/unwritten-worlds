export type RGB = readonly [number, number, number];

const TILE_SIZE = 16;

function rgb(r: number, g: number, b: number): RGB {
	return [
		Math.round(Math.max(0, Math.min(255, r))),
		Math.round(Math.max(0, Math.min(255, g))),
		Math.round(Math.max(0, Math.min(255, b))),
	];
}

/** Periodic hash — equal at opposite edges so tiles repeat seamlessly. */
function seamlessHash(x: number, y: number, seed: number): number {
	const fx = (x / TILE_SIZE) * Math.PI * 2;
	const fy = (y / TILE_SIZE) * Math.PI * 2;
	const v =
		Math.sin(fx + seed * 1.17) * Math.cos(fy + seed * 0.83) +
		Math.sin(fx * 2 + seed * 2.31) * Math.sin(fy * 2 + seed * 1.61) * 0.55 +
		Math.cos(fx * 3 + fy * 2 + seed * 3.07) * 0.3;
	return (v + 2.15) / 4.3;
}

export function createPixelGrid(
	width: number,
	height: number,
	painter: (x: number, y: number) => RGB,
): Uint8Array {
	const data = new Uint8Array(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const [r, g, b] = painter(x, y);
			const index = (y * width + x) * 4;
			data[index] = r;
			data[index + 1] = g;
			data[index + 2] = b;
			data[index + 3] = 255;
		}
	}
	enforceSeamlessEdges(data, width, height);
	return data;
}

function enforceSeamlessEdges(data: Uint8Array, width: number, height: number): void {
	for (let y = 0; y < height; y++) {
		blendEdgePixels(data, width, 0, y, width - 1, y);
	}
	for (let x = 0; x < width; x++) {
		blendEdgePixels(data, width, x, 0, x, height - 1);
	}
}

function blendEdgePixels(
	data: Uint8Array,
	width: number,
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): void {
	const i1 = (y1 * width + x1) * 4;
	const i2 = (y2 * width + x2) * 4;
	for (let channel = 0; channel < 3; channel++) {
		const average = (data[i1 + channel] + data[i2 + channel]) / 2;
		data[i1 + channel] = average;
		data[i2 + channel] = average;
	}
}

export const GRASS_TOP_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const variation = seamlessHash(x, y, 1) * 18;
	return rgb(72 + variation, 132 + variation * 0.6, 42 + variation * 0.3);
});

export const GRASS_SIDE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const variation = seamlessHash(x, y, 2) * 16;
	if (y < 4) {
		return rgb(70 + variation, 128 + variation * 0.5, 40 + variation * 0.25);
	}

	const t = (y - 4) / 12;
	const grass = rgb(68 + variation * 0.4, 118 + variation * 0.3, 38);
	const dirt = rgb(118 + variation, 86 + variation * 0.5, 52 + variation * 0.3);
	return rgb(
		grass[0] * (1 - t) + dirt[0] * t,
		grass[1] * (1 - t) + dirt[1] * t,
		grass[2] * (1 - t) + dirt[2] * t,
	);
});

export const DIRT_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const variation = seamlessHash(x, y, 4) * 20;
	return rgb(118 + variation, 84 + variation * 0.45, 50 + variation * 0.35);
});

export const STONE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const cluster = seamlessHash(x >> 1, y >> 1, 5);
	const variation = cluster * 24 + seamlessHash(x, y, 6) * 10;
	const base = 118 + variation;
	return rgb(base, base, base + 2);
});
