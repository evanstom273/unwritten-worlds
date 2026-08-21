export type RGB = readonly [number, number, number];

const TILE_SIZE = 32;

function rgb(r: number, g: number, b: number): RGB {
	return [
		Math.round(Math.max(0, Math.min(255, r))),
		Math.round(Math.max(0, Math.min(255, g))),
		Math.round(Math.max(0, Math.min(255, b))),
	];
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
	return rgb(
		a[0] * (1 - t) + b[0] * t,
		a[1] * (1 - t) + b[1] * t,
		a[2] * (1 - t) + b[2] * t,
	);
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

/** Higher-frequency seamless noise for pixel-scale detail. */
function fineNoise(x: number, y: number, seed: number): number {
	const fx = (x / TILE_SIZE) * Math.PI * 2;
	const fy = (y / TILE_SIZE) * Math.PI * 2;
	const v =
		Math.sin(fx * 5 + seed * 0.91) * Math.cos(fy * 6 + seed * 1.43) +
		Math.sin(fx * 11 + fy * 7 + seed * 2.17) * 0.45 +
		Math.cos(fx * 9 - fy * 8 + seed * 3.29) * 0.25;
	return (v + 1.7) / 3.4;
}

function cellHash(cellX: number, cellY: number, seed: number): number {
	const fx = (cellX / 4) * Math.PI * 2;
	const fy = (cellY / 4) * Math.PI * 2;
	return (Math.sin(fx * 3 + seed) * Math.cos(fy * 2 + seed * 1.5) + 1) * 0.5;
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

const GRASS_BRIGHT = rgb(88, 148, 52);
const GRASS_MID = rgb(68, 128, 42);
const GRASS_DARK = rgb(52, 102, 34);
const GRASS_SHADOW = rgb(42, 86, 28);

export const GRASS_TOP_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const macro = seamlessHash(x >> 2, y >> 2, 1);
	const meso = seamlessHash(x, y, 1.5);
	const micro = fineNoise(x, y, 11);

	let color = mixRgb(GRASS_MID, GRASS_DARK, macro * 0.55 + meso * 0.25);
	color = mixRgb(color, GRASS_BRIGHT, Math.max(0, micro - 0.62) * 1.8);

	const bladeSeed = Math.floor(seamlessHash(x >> 1, y >> 1, 12) * 5);
	const bladeLine = (x * 2 + y * 3 + bladeSeed) % 7 === 0;
	if (bladeLine) {
		color = mixRgb(color, GRASS_SHADOW, 0.35 + micro * 0.2);
	}

	const clump = seamlessHash(x >> 1, y >> 1, 13);
	if (clump > 0.78) {
		color = mixRgb(color, GRASS_BRIGHT, (clump - 0.78) * 3.5);
	} else if (clump < 0.18) {
		color = mixRgb(color, GRASS_DARK, (0.18 - clump) * 2.5);
	}

	if (fineNoise(x, y, 14) > 0.93) {
		color = mixRgb(color, rgb(196, 188, 72), 0.55);
	}

	return color;
});

export const GRASS_SIDE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const variation = seamlessHash(x, y, 2) * 14 + fineNoise(x, y, 21) * 8;

	if (y < 10) {
		const blade = fineNoise(x, y, 22);
		let grass = mixRgb(GRASS_MID, GRASS_BRIGHT, blade);
		if ((x + Math.floor(seamlessHash(0, y, 23) * 4)) % 3 === 0 && y < 8) {
			grass = mixRgb(grass, GRASS_SHADOW, 0.4);
		}
		if (y >= 6 && fineNoise(x, y, 24) > 0.82) {
			grass = mixRgb(grass, rgb(58, 38, 22), 0.25);
		}
		return rgb(
			grass[0] + variation * 0.3,
			grass[1] + variation * 0.2,
			grass[2] + variation * 0.1,
		);
	}

	const t = (y - 10) / 22;
	const grass = rgb(62 + variation * 0.35, 112 + variation * 0.25, 36);
	const dirt = rgb(112 + variation, 78 + variation * 0.45, 46 + variation * 0.35);
	let color = mixRgb(grass, dirt, t * t);

	if (y > 14) {
		const pebble = cellHash(x >> 2, y >> 2, 25);
		if (pebble > 0.82) {
			color = mixRgb(color, rgb(92, 88, 84), 0.45);
		}
		if (fineNoise(x, y, 26) > 0.88) {
			color = mixRgb(color, rgb(68, 48, 28), 0.35);
		}
	}

	return color;
});

export const DIRT_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const macro = seamlessHash(x >> 2, y >> 2, 4);
	const meso = seamlessHash(x, y, 4.2);
	const micro = fineNoise(x, y, 41);

	let color = rgb(
		108 + macro * 22 + meso * 10,
		76 + macro * 14 + meso * 8,
		44 + macro * 10 + meso * 6,
	);

	const pebbleCell = cellHash(x >> 2, y >> 2, 42);
	const pebbleX = (x % 4) - 1.5;
	const pebbleY = (y % 4) - 1.5;
	if (pebbleCell > 0.72 && pebbleX * pebbleX + pebbleY * pebbleY < 1.8) {
		color = mixRgb(color, rgb(98, 94, 90), 0.65);
	}

	if (micro > 0.86) {
		color = mixRgb(color, rgb(138, 98, 58), 0.35);
	} else if (micro < 0.12) {
		color = mixRgb(color, rgb(72, 52, 32), 0.4);
	}

	const worm = fineNoise(x >> 1, y >> 1, 43);
	if (worm > 0.92 && worm < 0.96) {
		color = mixRgb(color, rgb(58, 42, 26), 0.5);
	}

	const rootLine = (x + y * 2 + Math.floor(macro * 5)) % 11 === 0;
	if (rootLine) {
		color = mixRgb(color, rgb(82, 58, 34), 0.3);
	}

	return color;
});

export const STONE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const cluster = seamlessHash(x >> 2, y >> 2, 5);
	const grain = seamlessHash(x, y, 6);
	const speck = fineNoise(x, y, 51);

	let base = 108 + cluster * 28 + grain * 12 + speck * 6;
	let color = rgb(base, base, base + 4);

	const crackA = Math.abs(fineNoise(x, y, 52) - fineNoise(x + 1, y, 52)) > 0.42;
	const crackB = Math.abs(fineNoise(x, y, 53) - fineNoise(x, y + 1, 53)) > 0.42;
	if (crackA || crackB) {
		color = mixRgb(color, rgb(72, 72, 76), 0.55);
	}

	if (cluster > 0.82) {
		color = mixRgb(color, rgb(148, 148, 152), 0.35);
	} else if (cluster < 0.15) {
		color = mixRgb(color, rgb(82, 82, 86), 0.45);
	}

	if (speck > 0.94) {
		color = mixRgb(color, rgb(168, 172, 178), 0.5);
	}

	const vein = seamlessHash(x + y, x - y, 54);
	if (vein > 0.88 && vein < 0.92) {
		color = mixRgb(color, rgb(96, 98, 108), 0.4);
	}

	return color;
});

const PLANK_LIGHT = rgb(196, 152, 92);
const PLANK_MID = rgb(172, 128, 72);
const PLANK_DARK = rgb(138, 98, 56);
const PLANK_GAP = rgb(92, 64, 36);

export const PLANKS_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const plankIndex = Math.floor(y / 8);
	const localY = y % 8;
	const plankSeed = cellHash(plankIndex, 0, 7);

	if (localY === 0) {
		return mixRgb(PLANK_GAP, PLANK_DARK, fineNoise(x, y, 61) * 0.35);
	}

	let color = mixRgb(PLANK_MID, PLANK_LIGHT, plankSeed * 0.45 + seamlessHash(x >> 2, plankIndex, 62) * 0.3);

	const grainLine = localY % 2 === 0 && fineNoise(x, y, 63) > 0.35;
	if (grainLine) {
		color = mixRgb(color, PLANK_DARK, 0.18 + fineNoise(x, y, 64) * 0.12);
	}

	const knotX = Math.floor(plankSeed * 20 + 6);
	const knotY = 3 + Math.floor(cellHash(plankIndex, 1, 65) * 3);
	const knotDist = Math.hypot(x - knotX, localY - knotY);
	if (knotDist < 2.2) {
		color = mixRgb(color, PLANK_DARK, 0.55 - knotDist * 0.15);
	}

	if ((x === 4 || x === 20) && localY === 4 && plankIndex % 2 === 0) {
		color = mixRgb(color, rgb(72, 72, 76), 0.65);
	}

	if (fineNoise(x, y, 66) > 0.9) {
		color = mixRgb(color, PLANK_LIGHT, 0.25);
	}

	return color;
});

export const LOG_TOP_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const centerX = x - (TILE_SIZE - 1) / 2;
	const centerY = y - (TILE_SIZE - 1) / 2;
	const angle = Math.atan2(centerY, centerX);
	const wobble = Math.sin(angle * 7 + seamlessHash(x, y, 8) * 4) * 1.4;
	const ring = Math.hypot(centerX, centerY) + wobble;
	const ringNoise = fineNoise(x, y, 81) * 10 + seamlessHash(x, y, 8) * 8;
	const base = 118 + ringNoise;

	const heartwood = rgb(base * 0.48, base * 0.32, base * 0.18);
	const ringDark = rgb(base * 0.62, base * 0.42, base * 0.24);
	const ringLight = rgb(base * 0.86, base * 0.62, base * 0.36);
	const sapwood = rgb(base * 0.78, base * 0.56, base * 0.32);

	if (ring < 3.5) {
		return heartwood;
	}

	const ringBand = ring / 2.8;
	const ringFrac = ringBand - Math.floor(ringBand);
	if (ringFrac < 0.18) {
		return mixRgb(ringDark, ringLight, ringFrac / 0.18);
	}

	let color = mixRgb(sapwood, ringLight, fineNoise(x, y, 82) * 0.35);

	const crack = Math.abs(Math.sin(angle * 5 + seamlessHash(x >> 2, y >> 2, 83) * 3)) < 0.06 && ring > 6;
	if (crack) {
		color = mixRgb(color, ringDark, 0.55);
	}

	return color;
});

export const LOG_SIDE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const strip = Math.floor((x + Math.floor(seamlessHash(0, y >> 2, 9) * 3)) / 5);
	const stripPhase = cellHash(strip, 0, 91);
	const ridge = Math.abs((x + Math.floor(stripPhase * 4)) % 5 - 2) < 0.6;

	const barkBase = 102 + seamlessHash(x >> 1, y >> 2, 9) * 22 + fineNoise(x, y, 92) * 10;
	let color = rgb(barkBase * 0.78, barkBase * 0.55, barkBase * 0.32);

	if (ridge) {
		color = mixRgb(color, rgb(68, 46, 26), 0.45);
	} else {
		color = mixRgb(color, rgb(128, 88, 50), 0.2);
	}

	const lenticel = y % 6 === 2 && fineNoise(x, y, 93) > 0.72 && fineNoise(x, y, 93) < 0.78;
	if (lenticel) {
		color = mixRgb(color, rgb(92, 72, 48), 0.5);
	}

	const mossPatch = seamlessHash(x >> 2, y >> 2, 94);
	if (mossPatch > 0.84 && ridge) {
		color = mixRgb(color, rgb(58, 82, 38), 0.35);
	}

	if (fineNoise(x, y, 95) > 0.92) {
		color = mixRgb(color, rgb(48, 32, 18), 0.35);
	}

	return color;
});

export const GLASS_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const base = rgb(168, 206, 228);
	const shimmer = fineNoise(x, y, 101);
	const macro = seamlessHash(x, y, 10);

	let color = mixRgb(base, rgb(198, 228, 242), shimmer * 0.45);

	const highlight = (x + y) / (TILE_SIZE * 2);
	if (highlight > 0.55 && highlight < 0.62 && shimmer > 0.5) {
		color = mixRgb(color, rgb(230, 244, 252), 0.65);
	}

	if (macro > 0.92) {
		color = mixRgb(color, rgb(140, 180, 210), 0.25);
	}

	const edgeDist = Math.min(x, y, TILE_SIZE - 1 - x, TILE_SIZE - 1 - y);
	if (edgeDist < 2) {
		color = mixRgb(color, rgb(120, 158, 188), 0.35);
	}

	return color;
});

for (let index = 3; index < GLASS_PIXELS.length; index += 4) {
	const pixel = (index / 4) | 0;
	const x = pixel % TILE_SIZE;
	const y = Math.floor(pixel / TILE_SIZE);
	const edgeDist = Math.min(x, y, TILE_SIZE - 1 - x, TILE_SIZE - 1 - y);
	const shimmer = fineNoise(x, y, 101);
	GLASS_PIXELS[index] = edgeDist < 2 ? 140 : 72 + Math.floor(shimmer * 48);
}
