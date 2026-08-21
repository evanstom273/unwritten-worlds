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

function torusDelta(a: number, b: number, size: number): number {
	let delta = Math.abs(a - b);
	if (delta > size / 2) {
		delta = size - delta;
	}
	return delta;
}

function torusDistSq(x: number, y: number, cx: number, cy: number): number {
	const dx = torusDelta(x, cx, TILE_SIZE);
	const dy = torusDelta(y, cy, TILE_SIZE);
	return dx * dx + dy * dy;
}

function inEllipse(
	x: number,
	y: number,
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): boolean {
	const dx = torusDelta(x, cx, TILE_SIZE);
	const dy = torusDelta(y, cy, TILE_SIZE);
	return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
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

const GRASS_BRIGHT = rgb(92, 152, 56);
const GRASS_MID = rgb(72, 132, 46);
const GRASS_DARK = rgb(56, 108, 36);
const GRASS_SHADOW = rgb(46, 92, 30);

function grassTuftShade(x: number, y: number): number {
	let shade = 0;
	const anchors = [
		[3, 5], [11, 2], [19, 7], [27, 4],
		[6, 14], [14, 18], [22, 12], [30, 16],
		[4, 24], [12, 28], [20, 22], [26, 27],
	];
	for (const [ax, ay] of anchors) {
		const d2 = torusDistSq(x, y, ax, ay);
		if (d2 <= 2) {
			shade = Math.max(shade, 3);
		} else if (d2 <= 5) {
			shade = Math.max(shade, 2);
		} else if (d2 <= 9) {
			shade = Math.max(shade, 1);
		}
	}
	return shade;
}

function grassPatchTone(x: number, y: number): number {
	const cellX = Math.floor(x / 8);
	const cellY = Math.floor(y / 8);
	return cellHash(cellX, cellY, 101);
}

export const GRASS_TOP_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const patch = grassPatchTone(x, y);
	let color = GRASS_MID;

	if (patch > 0.66) {
		color = mixRgb(GRASS_MID, GRASS_BRIGHT, (patch - 0.66) * 2.2);
	} else if (patch < 0.34) {
		color = mixRgb(GRASS_MID, GRASS_DARK, (0.34 - patch) * 2.2);
	}

	const tuft = grassTuftShade(x, y);
	if (tuft === 3) {
		color = mixRgb(color, GRASS_SHADOW, 0.42);
	} else if (tuft === 2) {
		color = mixRgb(color, GRASS_DARK, 0.28);
	} else if (tuft === 1) {
		color = mixRgb(color, GRASS_BRIGHT, 0.18);
	}

	const softBlob = inEllipse(x, y, 16, 16, 11, 9);
	if (softBlob && patch > 0.5) {
		color = mixRgb(color, GRASS_BRIGHT, 0.12);
	}

	return color;
});

const DIRT_MID = rgb(112, 80, 48);
const DIRT_LIGHT = rgb(128, 94, 58);
const DIRT_DARK = rgb(92, 64, 38);
const DIRT_DEEP = rgb(78, 54, 32);

function dirtClumpShade(x: number, y: number): number {
	const clumps = [
		{ cx: 5, cy: 4, rx: 4, ry: 3 },
		{ cx: 18, cy: 7, rx: 5, ry: 4 },
		{ cx: 28, cy: 3, rx: 3, ry: 3 },
		{ cx: 9, cy: 17, rx: 4, ry: 5 },
		{ cx: 23, cy: 19, rx: 5, ry: 4 },
		{ cx: 2, cy: 26, rx: 4, ry: 4 },
		{ cx: 15, cy: 28, rx: 5, ry: 3 },
		{ cx: 27, cy: 24, rx: 4, ry: 4 },
	];

	for (const clump of clumps) {
		if (inEllipse(x, y, clump.cx, clump.cy, clump.rx, clump.ry)) {
			const cx = clump.cx;
			const cy = clump.cy;
			const dx = torusDelta(x, cx, TILE_SIZE);
			const dy = torusDelta(y, cy, TILE_SIZE);
			const edge = (dx * dx) / (clump.rx * clump.rx) + (dy * dy) / (clump.ry * clump.ry);
			if (edge > 0.72) {
				return -1;
			}
			return 1;
		}
	}
	return 0;
}

export const GRASS_SIDE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	if (y < 9) {
		let color = GRASS_MID;
		const tuft = grassTuftShade(x, y);
		if (tuft >= 2) {
			color = mixRgb(color, GRASS_SHADOW, 0.35);
		} else if (tuft === 1) {
			color = mixRgb(color, GRASS_BRIGHT, 0.2);
		}

		if (y >= 5 && (x + Math.floor(seamlessHash(0, y, 201) * 3)) % 5 === 0) {
			color = mixRgb(color, rgb(58, 40, 24), 0.22);
		}

		return color;
	}

	if (y < 13) {
		const t = (y - 9) / 4;
		const grass = mixRgb(GRASS_MID, GRASS_DARK, 0.35);
		return mixRgb(grass, DIRT_MID, t);
	}

	let color = DIRT_MID;
	const clump = dirtClumpShade(x, y);
	if (clump > 0) {
		color = mixRgb(color, DIRT_LIGHT, 0.35);
	} else if (clump < 0) {
		color = mixRgb(color, DIRT_DARK, 0.3);
	}

	const patch = cellHash(Math.floor(x / 8), Math.floor(y / 8), 202);
	if (patch > 0.72) {
		color = mixRgb(color, DIRT_LIGHT, 0.15);
	} else if (patch < 0.28) {
		color = mixRgb(color, DIRT_DARK, 0.12);
	}

	if (inEllipse(x, y, 24, 22, 2, 2)) {
		color = mixRgb(color, rgb(98, 94, 88), 0.4);
	}

	return color;
});

export const DIRT_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	let color = DIRT_MID;
	const clump = dirtClumpShade(x, y);

	if (clump > 0) {
		color = mixRgb(color, DIRT_LIGHT, 0.32);
	} else if (clump < 0) {
		color = mixRgb(color, DIRT_DARK, 0.28);
	}

	const patch = cellHash(Math.floor(x / 8), Math.floor(y / 8), 203);
	if (patch > 0.7) {
		color = mixRgb(color, DIRT_LIGHT, 0.14);
	} else if (patch < 0.3) {
		color = mixRgb(color, DIRT_DEEP, 0.12);
	}

	if (inEllipse(x, y, 7, 11, 2, 2) || inEllipse(x, y, 26, 28, 2, 1)) {
		color = mixRgb(color, rgb(96, 92, 86), 0.38);
	}

	const rootArc = inEllipse(x, y, 16, 0, 14, 4) && y < 6;
	if (rootArc) {
		color = mixRgb(color, DIRT_DEEP, 0.18);
	}

	return color;
});

const STONE_BASE = rgb(118, 118, 122);
const STONE_LIGHT = rgb(142, 142, 148);
const STONE_MID = rgb(108, 108, 112);
const STONE_DARK = rgb(88, 88, 92);
const STONE_DEEP = rgb(74, 74, 78);

function stoneMassShade(x: number, y: number): number {
	const masses = [
		{ cx: 7, cy: 6, rx: 6, ry: 5, shade: 1 },
		{ cx: 22, cy: 5, rx: 7, ry: 4, shade: -1 },
		{ cx: 14, cy: 16, rx: 8, ry: 6, shade: 1 },
		{ cx: 28, cy: 18, rx: 5, ry: 5, shade: -1 },
		{ cx: 4, cy: 24, rx: 6, ry: 5, shade: -1 },
		{ cx: 20, cy: 27, rx: 7, ry: 4, shade: 1 },
	];

	for (const mass of masses) {
		if (inEllipse(x, y, mass.cx, mass.cy, mass.rx, mass.ry)) {
			return mass.shade;
		}
	}
	return 0;
}

function nearStoneCrack(x: number, y: number): boolean {
	const crackA = Math.abs(y - (10 + Math.round(Math.sin(x * 0.45) * 1.5)));
	const crackB = Math.abs(
		y - (22 + Math.round(Math.sin((x + 8) * 0.38 + 1.2) * 1.2)),
	);
	const crackC = Math.abs((x - 16) - Math.round(Math.sin(y * 0.35) * 2));
	return crackA <= 0 || crackB <= 0 || (crackC <= 0 && y > 6 && y < 26);
}

export const STONE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	let color = STONE_BASE;
	const mass = stoneMassShade(x, y);

	if (mass > 0) {
		color = mixRgb(color, STONE_LIGHT, 0.42);
	} else if (mass < 0) {
		color = mixRgb(color, STONE_DARK, 0.38);
	}

	const region = cellHash(Math.floor(x / 8), Math.floor(y / 8), 301);
	if (region > 0.68 && mass === 0) {
		color = mixRgb(color, STONE_MID, 0.2);
	} else if (region < 0.32 && mass === 0) {
		color = mixRgb(color, STONE_DARK, 0.15);
	}

	if (nearStoneCrack(x, y)) {
		color = mixRgb(color, STONE_DEEP, 0.65);
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

const LOG_HEART = rgb(88, 58, 34);
const LOG_RING_DARK = rgb(108, 72, 42);
const LOG_RING_MID = rgb(132, 92, 54);
const LOG_RING_LIGHT = rgb(156, 112, 66);

function logRingIndex(x: number, y: number): number {
	const centerX = 15.5;
	const centerY = 15.5;
	const dx = x - centerX;
	const dy = y - centerY;
	const angle = Math.atan2(dy, dx);
	const wobble =
		Math.sin(angle * 5 + 0.8) * 1.2 +
		Math.sin(angle * 9 - 1.4) * 0.6 +
		Math.sin((x + y) * 0.35) * 0.5;
	const ring = Math.hypot(dx, dy) + wobble;
	return Math.floor(ring / 2.4);
}

export const LOG_TOP_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const dx = x - 15.5;
	const dy = y - 15.5;
	const dist = Math.hypot(dx, dy);

	if (dist < 3.2) {
		return LOG_HEART;
	}

	const ring = logRingIndex(x, y);
	const ringFrac = (dist % 2.4) / 2.4;

	if (ringFrac < 0.22) {
		return mixRgb(LOG_RING_DARK, LOG_RING_MID, ringFrac / 0.22);
	}

	let color = ring % 2 === 0 ? LOG_RING_MID : LOG_RING_LIGHT;

	const angle = Math.atan2(dy, dx);
	if (Math.abs(Math.sin(angle * 4 + dist * 0.3)) < 0.07 && dist > 5) {
		color = mixRgb(color, LOG_RING_DARK, 0.45);
	}

	if (inEllipse(x, y, 22, 10, 2, 1)) {
		color = mixRgb(color, LOG_RING_DARK, 0.35);
	}

	return color;
});

const BARK_BASE = rgb(118, 82, 48);
const BARK_RAISED = rgb(138, 98, 58);
const BARK_GROOVE = rgb(72, 48, 28);
const BARK_KNOT = rgb(58, 38, 22);

function barkGrooveDepth(x: number, y: number): number {
	const grooves = [
		{ base: 4, phase: 0.0, amp: 1.6, breakAt: [7, 19] },
		{ base: 11, phase: 1.3, amp: 1.2, breakAt: [4, 24] },
		{ base: 18, phase: 2.1, amp: 1.8, breakAt: [11, 28] },
		{ base: 26, phase: 0.7, amp: 1.4, breakAt: [15] },
	];

	let depth = 0;
	for (const groove of grooves) {
		const wobble = Math.round(Math.sin(y * 0.38 + groove.phase) * groove.amp);
		const gx = (groove.base + wobble + TILE_SIZE) % TILE_SIZE;
		const dist = torusDelta(x, gx, TILE_SIZE);
		if (dist > 1) {
			continue;
		}

		let broken = false;
		for (const breakY of groove.breakAt) {
			if (Math.abs(y - breakY) <= 1) {
				broken = true;
				break;
			}
		}
		if (!broken) {
			depth = Math.max(depth, dist === 0 ? 2 : 1);
		}
	}

	if (inEllipse(x, y, 9, 13, 2, 2) || inEllipse(x, y, 23, 25, 2, 1)) {
		depth = Math.max(depth, 2);
	}

	return depth;
}

export const LOG_SIDE_PIXELS = createPixelGrid(TILE_SIZE, TILE_SIZE, (x, y) => {
	const groove = barkGrooveDepth(x, y);
	let color = BARK_BASE;

	if (groove === 2) {
		color = BARK_GROOVE;
	} else if (groove === 1) {
		color = mixRgb(BARK_GROOVE, BARK_BASE, 0.35);
	} else if ((x + y) % 7 === 0 && groove === 0) {
		color = mixRgb(BARK_BASE, BARK_RAISED, 0.25);
	}

	if (inEllipse(x, y, 9, 13, 2, 2)) {
		color = mixRgb(color, BARK_KNOT, 0.55);
	}
	if (inEllipse(x, y, 23, 25, 2, 1)) {
		color = mixRgb(color, BARK_KNOT, 0.45);
	}

	if (y % 9 === 5 && torusDelta(x, 14, TILE_SIZE) <= 1) {
		color = mixRgb(color, rgb(96, 74, 48), 0.35);
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
