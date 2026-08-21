import * as THREE from 'three';
import {
	MAX_PITCH,
	MOUSE_SENSITIVITY,
	PLAYER_EYE_HEIGHT,
	TOUCH_LOOK_SENSITIVITY,
} from '../config/PlayerConfig';
import type { InputState } from '../input/InputState';
import type { InputMode } from '../input/InputState';

export class PlayerCamera {
	private yaw = 0;
	private pitch = 0;
	private readonly lookDirection = new THREE.Vector3();

	applyLookInput(input: InputState, inputMode: InputMode): void {
		const sensitivity = inputMode === 'touch' ? TOUCH_LOOK_SENSITIVITY : MOUSE_SENSITIVITY;
		this.yaw -= input.lookX * sensitivity;
		this.pitch -= input.lookY * sensitivity;
		this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));
	}

	updateCamera(
		camera: THREE.PerspectiveCamera,
		feetX: number,
		feetY: number,
		feetZ: number,
	): void {
		const eyeX = feetX;
		const eyeY = feetY + PLAYER_EYE_HEIGHT;
		const eyeZ = feetZ;

		camera.position.set(eyeX, eyeY, eyeZ);

		this.lookDirection.set(
			-Math.sin(this.yaw) * Math.cos(this.pitch),
			Math.sin(this.pitch),
			-Math.cos(this.yaw) * Math.cos(this.pitch),
		);

		camera.lookAt(
			eyeX + this.lookDirection.x,
			eyeY + this.lookDirection.y,
			eyeZ + this.lookDirection.z,
		);
	}

	getYaw(): number {
		return this.yaw;
	}
}
