import { useEffect, useRef, useState } from 'react';
import { DEBUG_HUD_ENABLED } from '../game/config/DebugConfig';
import { Game, type GameDebugStats, type QuickEquipSnapshot } from '../game/Game';
import type { InputMode } from '../game/input/InputState';
import { Crosshair } from './Crosshair';
import { PointerLockHint } from './PointerLockHint';
import { QuickEquipHud } from './QuickEquipHud';
import { RotateDeviceOverlay } from './RotateDeviceOverlay';
import { TouchControls } from './TouchControls';
import { usePortraitOrientation } from '../hooks/usePortraitOrientation';

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const touchRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<Game | null>(null);
	const [stats, setStats] = useState<GameDebugStats | null>(null);
	const [equipSnapshot, setEquipSnapshot] = useState<QuickEquipSnapshot | null>(null);
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
		game.setQuickEquipCallback(setEquipSnapshot);

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

	const showTouchControls = inputMode === 'touch' && !isPortrait && equipSnapshot !== null;
	const showDesktopEquipHud = inputMode === 'keyboard-mouse' && equipSnapshot !== null && !isPortrait;
	const showPointerLockHint = inputMode === 'keyboard-mouse' && !pointerLocked && !isPortrait;
	const showCrosshair = !isPortrait;

	return (
		<>
			<div ref={containerRef} className="game-canvas" />
			{showCrosshair && <Crosshair />}
			{showPointerLockHint && <PointerLockHint />}
			{showDesktopEquipHud && <QuickEquipHud snapshot={equipSnapshot} />}
			{showTouchControls && (
				<div ref={touchRef}>
					<TouchControls snapshot={equipSnapshot} />
				</div>
			)}
			{isPortrait && <RotateDeviceOverlay />}
			{DEBUG_HUD_ENABLED && stats && (
				<aside className="debug-overlay">
					<div className="debug-row">
						<span>FPS min/avg/max</span>
						<span>{stats.fpsMin} / {stats.fpsAvg} / {stats.fpsMax}</span>
					</div>
					<div className="debug-row">
						<span>Frame</span>
						<span>{stats.frameTimeMs.toFixed(1)} ms</span>
					</div>
					<div className="debug-row">
						<span>Player</span>
						<span>
							{stats.playerX.toFixed(1)}, {stats.playerY.toFixed(1)}, {stats.playerZ.toFixed(1)}
						</span>
					</div>
					<div className="debug-row">
						<span>Hit</span>
						<span>
							{stats.targetHit
								? `${stats.targetBlockX}, ${stats.targetBlockY}, ${stats.targetBlockZ}`
								: '—'}
						</span>
					</div>
					<div className="debug-row">
						<span>Face</span>
						<span>{stats.targetHit ? stats.targetFace : '—'}</span>
					</div>
					<div className="debug-row">
						<span>Place</span>
						<span>
							{stats.targetHit
								? `${stats.placeBlockX}, ${stats.placeBlockY}, ${stats.placeBlockZ}`
								: '—'}
						</span>
					</div>
					<div className="debug-row">
						<span>Chunk</span>
						<span>{stats.chunkX}, {stats.chunkZ}</span>
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
						<span>Active chunks</span>
						<span>{stats.activeMeshCount}</span>
					</div>
					<div className="debug-row">
						<span>Built meshes</span>
						<span>{stats.builtMeshCount}</span>
					</div>
					<div className="debug-row">
						<span>Draw calls</span>
						<span>{stats.drawCalls}</span>
					</div>
					<div className="debug-row">
						<span>Triangles</span>
						<span>{stats.triangleCount.toLocaleString()}</span>
					</div>
					<div className="debug-row">
						<span>Faces</span>
						<span>{stats.visibleFaceCount.toLocaleString()}</span>
					</div>
					<div className="debug-row">
						<span>Sections</span>
						<span>{stats.allocatedSectionCount}</span>
					</div>
					<div className="debug-row">
						<span>Render dist</span>
						<span>{stats.renderDistance} chunks</span>
					</div>
					<div className="debug-row">
						<span>Pixel ratio</span>
						<span>{stats.pixelRatio.toFixed(2)}</span>
					</div>
				</aside>
			)}
		</>
	);
}
