import * as THREE from 'three';
import {
	MAX_PITCH,
	MOUSE_SENSITIVITY,
	PLAYER_EYE_HEIGHT,
	TOUCH_LOOK_SENSITIVITY,
} from '../config/PlayerConfig';
import { BASE_FOV } from '../config/RenderConfig';
import type { InputState } from '../input/InputState';
import type { InputMode } from '../input/InputState';
import { CameraEffects } from './CameraEffects';
import type { PlayerState } from './PlayerController';

export class PlayerCamera {
	private yaw = 0;
	private pitch = 0;
	private readonly lookDirection = new THREE.Vector3();
	private readonly cameraEffects = new CameraEffects();

	applyLookInput(input: InputState, inputMode: InputMode): void {
		const sensitivity = inputMode === 'touch' ? TOUCH_LOOK_SENSITIVITY : MOUSE_SENSITIVITY;
		this.yaw -= input.lookX * sensitivity;
		this.pitch -= input.lookY * sensitivity;
		this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));
	}

	update(delta: number, player: PlayerState): void {
		this.cameraEffects.update(delta, player, this.yaw);
	}

	updateCamera(
		camera: THREE.PerspectiveCamera,
		feetX: number,
		feetY: number,
		feetZ: number,
	): void {
		const visualOffset = this.cameraEffects.getVisualOffset();
		const eyeX = feetX + visualOffset.x;
		const eyeY = feetY + PLAYER_EYE_HEIGHT + visualOffset.y;
		const eyeZ = feetZ + visualOffset.z;

		camera.fov = this.cameraEffects.getFov();
		camera.updateProjectionMatrix();
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

	getBaseFov(): number {
		return BASE_FOV;
	}
}
