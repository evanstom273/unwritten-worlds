export type RGB = readonly [number, number, number];

function rgb(r: number, g: number, b: number): RGB {
	return [r, g, b];
}

function noise(x: number, y: number, seed: number): number {
	return ((x * 928371 + y * 689287 + seed * 123457) & 0xffff) / 0xffff;
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
	return data;
}

export const GRASS_TOP_PIXELS = createPixelGrid(16, 16, (x, y) => {
	const variation = noise(x, y, 1) * 18;
	return rgb(
		Math.min(255, 72 + variation),
		Math.min(255, 132 + variation * 0.6),
		Math.min(255, 42 + variation * 0.3),
	);
});

export const GRASS_SIDE_PIXELS = createPixelGrid(16, 16, (x, y) => {
	if (y < 4) {
		const variation = noise(x, y, 2) * 16;
		return rgb(
			Math.min(255, 70 + variation),
			Math.min(255, 128 + variation * 0.5),
			Math.min(255, 40 + variation * 0.25),
		);
	}

	const t = (y - 4) / 12;
	const variation = noise(x, y, 3) * 14;
	const grass = rgb(68 + variation * 0.4, 118 + variation * 0.3, 38);
	const dirt = rgb(118 + variation, 86 + variation * 0.5, 52 + variation * 0.3);
	return rgb(
		Math.round(grass[0] * (1 - t) + dirt[0] * t),
		Math.round(grass[1] * (1 - t) + dirt[1] * t),
		Math.round(grass[2] * (1 - t) + dirt[2] * t),
	);
});

export const DIRT_PIXELS = createPixelGrid(16, 16, (x, y) => {
	const variation = noise(x, y, 4) * 20;
	return rgb(
		Math.min(255, 118 + variation),
		Math.min(255, 84 + variation * 0.45),
		Math.min(255, 50 + variation * 0.35),
	);
});

export const STONE_PIXELS = createPixelGrid(16, 16, (x, y) => {
	const cluster = noise(x >> 1, y >> 1, 5);
	const variation = cluster * 24 + noise(x, y, 6) * 10;
	const base = 118 + variation;
	return rgb(base, base, base + 2);
});
