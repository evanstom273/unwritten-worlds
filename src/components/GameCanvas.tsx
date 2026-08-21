import { useEffect, useRef } from 'react';
import { Game } from '../game/Game';

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const game = new Game(container);

		return () => {
			game.dispose();
		};
	}, []);

	return <div ref={containerRef} className="game-canvas" />;
}
