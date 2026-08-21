import { useEffect, useRef, useState } from 'react';
import { Game, type GameDebugStats } from '../game/Game';

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [stats, setStats] = useState<GameDebugStats | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const game = new Game(container);
		game.setStatsCallback(setStats);

		return () => {
			game.dispose();
		};
	}, []);

	return (
		<>
			<div ref={containerRef} className="game-canvas" />
			{stats && (
				<aside className="debug-overlay">
					<div className="debug-row">
						<span>World</span>
						<span>
							{stats.worldWidth} × {stats.worldDepth} (Y {stats.worldMinY}–{stats.worldMaxY})
						</span>
					</div>
					<div className="debug-row">
						<span>Chunk size</span>
						<span>{stats.chunkSize} × {stats.chunkSize}</span>
					</div>
					<div className="debug-row">
						<span>Section size</span>
						<span>{stats.sectionSize}³</span>
					</div>
					<div className="debug-row">
						<span>Chunk columns</span>
						<span>{stats.chunkColumnCount}</span>
					</div>
					<div className="debug-row">
						<span>Allocated sections</span>
						<span>{stats.allocatedSectionCount}</span>
					</div>
					<div className="debug-row">
						<span>Rendered meshes</span>
						<span>{stats.renderedMeshCount}</span>
					</div>
					<div className="debug-row">
						<span>Visible faces</span>
						<span>{stats.visibleFaceCount.toLocaleString()}</span>
					</div>
					<div className="debug-row">
						<span>Triangles</span>
						<span>{stats.triangleCount.toLocaleString()}</span>
					</div>
					<div className="debug-row">
						<span>FPS</span>
						<span>{stats.fps}</span>
					</div>
				</aside>
			)}
		</>
	);
}
