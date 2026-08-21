import { useEffect, useState } from 'react';
import { isPortraitOrientation } from '../game/input/InputCapabilities';

export function usePortraitOrientation(): boolean {
	const [isPortrait, setIsPortrait] = useState(isPortraitOrientation);

	useEffect(() => {
		const update = (): void => {
			setIsPortrait(isPortraitOrientation());
		};

		window.addEventListener('resize', update);
		window.addEventListener('orientationchange', update);
		window.visualViewport?.addEventListener('resize', update);

		return () => {
			window.removeEventListener('resize', update);
			window.removeEventListener('orientationchange', update);
			window.visualViewport?.removeEventListener('resize', update);
		};
	}, []);

	return isPortrait;
}
