import { useEffect, useRef, useState } from 'react';
import { DEBUG_HUD_ENABLED } from '../game/config/DebugConfig';
import { Game, type GameDebugStats } from '../game/Game';
import type { InputMode } from '../game/input/InputState';
import { Crosshair } from './Crosshair';
import { PointerLockHint } from './PointerLockHint';
import { RotateDeviceOverlay } from './RotateDeviceOverlay';
import { TouchControls } from './TouchControls';
import { usePortraitOrientation } from '../hooks/usePortraitOrientation';

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const touchRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Game | null>(null);
	const [stats, setStats] = useState<GameDebugStats | null>(null);
	const [pointerLocked, setPointerLocked] = useState(false);
	const [inputMode, setInputMode] = useState<InputMode>('keyboard-mouse');
	const isPortrait = usePortraitOrientation();

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		const game = new Game(container);
		gameRef.current = game;
		setInputMode(game.getInputMode());
		game.setStatsCallback(setStats);
		game.setPointerLockCallback(setPointerLocked);

		return () => {
			game.dispose();
			gameRef.current = null;
		};
	}, []);

	useEffect(() => {
		const game = gameRef.current;
		const touchRoot = touchRef.current;
		if (!game || !touchRoot || inputMode !== 'touch') {
			return;
		}

		game.attachTouchControls(touchRoot);
		return () => {
			game.detachTouchControls();
		};
	}, [inputMode]);

	const showTouchControls = inputMode === 'touch' && !isPortrait;
	const showPointerLockHint = inputMode === 'keyboard-mouse' && !pointerLocked && !isPortrait;
	const showCrosshair = !isPortrait;

	return (
		<>
			<div ref={containerRef} className="game-canvas" />
			{showCrosshair && <Crosshair />}
			{showPointerLockHint && <PointerLockHint />}
			{showTouchControls && (
				<div ref={touchRef}>
					<TouchControls />
				</div>
			)}
			{isPortrait && <RotateDeviceOverlay />}
			{DEBUG_HUD_ENABLED && stats && (
				<aside className="debug-overlay">
					<div className="debug-row">
						<span>World</span>
						<span>
							{stats.worldWidth} × {stats.worldDepth} (Y {stats.worldMinY}–{stats.worldMaxY})
						</span>
					</div>
					<div className="debug-row">
						<span>Player</span>
						<span>
							{stats.playerX.toFixed(1)}, {stats.playerY.toFixed(1)}, {stats.playerZ.toFixed(1)}
						</span>
					</div>
					<div className="debug-row">
						<span>Chunk</span>
						<span>{stats.chunkX}, {stats.chunkZ}</span>
					</div>
					<div className="debug-row">
						<span>Section Y</span>
						<span>{stats.sectionY}</span>
					</div>
					<div className="debug-row">
						<span>Velocity</span>
						<span>
							{stats.velocityX.toFixed(1)}, {stats.velocityY.toFixed(1)}, {stats.velocityZ.toFixed(1)}
						</span>
					</div>
					<div className="debug-row">
						<span>Grounded</span>
						<span>{stats.grounded ? 'yes' : 'no'}</span>
					</div>
					<div className="debug-row">
						<span>Mode</span>
						<span>{stats.movementMode}</span>
					</div>
					<div className="debug-row">
						<span>Input</span>
						<span>{stats.inputType}</span>
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
