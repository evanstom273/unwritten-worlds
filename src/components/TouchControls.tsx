export function TouchControls() {
	return (
		<div className="touch-controls">
			<div className="touch-joystick" data-touch="joystick">
				<div className="touch-joystick-stick" data-touch="joystick-stick" />
			</div>
			<div className="touch-look" data-touch="look" aria-hidden="true" />
			<div className="touch-actions touch-actions-left">
				<button type="button" className="touch-btn touch-btn-crouch" data-touch="crouch">
					Crouch
				</button>
				<button type="button" className="touch-btn touch-btn-fly" data-touch="fly">
					Fly
				</button>
			</div>
			<div className="touch-actions">
				<button type="button" className="touch-btn touch-btn-break" data-touch="break">
					Break
				</button>
				<button type="button" className="touch-btn touch-btn-place" data-touch="place">
					Place
				</button>
				<button type="button" className="touch-btn touch-btn-jump" data-touch="jump">
					Jump
				</button>
				<button type="button" className="touch-btn touch-btn-sprint" data-touch="sprint">
					Sprint
				</button>
			</div>
		</div>
	);
}
