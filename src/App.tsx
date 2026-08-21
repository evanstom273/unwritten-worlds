import { GameCanvas } from './components/GameCanvas';

export function App() {
	return (
		<div className="app">
			<GameCanvas />
			<header className="overlay">
				<h1>Unwritten Worlds</h1>
				<p>First-Person Prototype</p>
			</header>
		</div>
	);
}
