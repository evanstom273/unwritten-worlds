import type { InputMode } from './InputState';

export function detectPrimaryInputMode(): InputMode {
	const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
	const hoverNone = window.matchMedia('(hover: none)').matches;
	const hasTouch = navigator.maxTouchPoints > 0;

	if (coarsePointer || (hasTouch && hoverNone)) {
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
