import type { InputMode } from './InputState';

export function detectPrimaryInputMode(): InputMode {
	const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const finePointer = window.matchMedia('(pointer: fine)').matches;

	if (coarsePointer && !finePointer) {
		return 'touch';
	}

	return 'keyboard-mouse';
}

export function isPortraitOrientation(): boolean {
	const viewport = window.visualViewport;
	const width = viewport?.width ?? window.innerWidth;
	const height = viewport?.height ?? window.innerHeight;
	return height > width;
}
