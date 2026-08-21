import * as THREE from 'three';
import {
	BASE_FOV,
	FOV_LERP_SPEED,
	LANDING_FEEDBACK_ENABLED,
	LANDING_MAX_OFFSET,
	LANDING_MIN_VELOCITY,
	LANDING_RECOVERY_SPEED,
	SPRINT_FOV_ADDITION,
	VIEW_BOB_BLEND_SPEED,
	VIEW_BOB_ENABLED,
	VIEW_BOB_HORIZONTAL_AMPLITUDE,
	VIEW_BOB_SPRINT_AMPLITUDE_SCALE,
	VIEW_BOB_SPRINT_FREQUENCY,
	VIEW_BOB_VERTICAL_AMPLITUDE,
	VIEW_BOB_WALK_FREQUENCY,
} from '../config/RenderConfig';
import { SPRINT_SPEED, WALK_SPEED } from '../config/PlayerConfig';
import type { PlayerState } from './PlayerController';

export interface CameraVisualOffset {
	x: number;
	y: number;
	z: number;
}

export class CameraEffects {
	private bobPhase = 0;
	private bobBlend = 0;
	private landingOffset = 0;
	private currentFov = BASE_FOV;
	private readonly offset = { x: 0, y: 0, z: 0 };
	private readonly rightOffset = new THREE.Vector3();

	update(delta: number, player: PlayerState, yaw: number): void {
		this.updateViewBob(delta, player, yaw);
		this.updateLandingFeedback(delta, player);
		this.updateFov(delta, player);
	}

	getVisualOffset(): CameraVisualOffset {
		return this.offset;
	}

	getFov(): number {
		return this.currentFov;
	}

	private updateViewBob(delta: number, player: PlayerState, yaw: number): void {
		if (!VIEW_BOB_ENABLED) {
			this.offset.x = 0;
			this.offset.y = 0;
			this.offset.z = 0;
			return;
		}

		const moving =
			player.grounded &&
			!player.flying &&
			player.horizontalSpeed > 0.15 &&
			!player.airborne;

		const targetBlend = moving ? 1 : 0;
		this.bobBlend += (targetBlend - this.bobBlend) * Math.min(1, VIEW_BOB_BLEND_SPEED * delta);

		if (moving) {
			const sprinting = player.horizontalSpeed > WALK_SPEED + 0.5;
			const frequency = sprinting ? VIEW_BOB_SPRINT_FREQUENCY : VIEW_BOB_WALK_FREQUENCY;
			const speedFactor = Math.min(player.horizontalSpeed / SPRINT_SPEED, 1);
			this.bobPhase += frequency * speedFactor * delta * Math.PI * 2;
		}

		const amplitudeScale =
			player.horizontalSpeed > WALK_SPEED + 0.5
				? VIEW_BOB_SPRINT_AMPLITUDE_SCALE
				: 1;

		const verticalBob =
			Math.sin(this.bobPhase) *
			VIEW_BOB_VERTICAL_AMPLITUDE *
			amplitudeScale *
			this.bobBlend;
		const horizontalBob =
			Math.cos(this.bobPhase * 0.5) *
			VIEW_BOB_HORIZONTAL_AMPLITUDE *
			amplitudeScale *
			this.bobBlend;

		this.rightOffset.set(Math.cos(yaw), 0, -Math.sin(yaw));

		this.offset.x = this.rightOffset.x * horizontalBob;
		this.offset.y = verticalBob + this.landingOffset;
		this.offset.z = this.rightOffset.z * horizontalBob;
	}

	private updateLandingFeedback(delta: number, player: PlayerState): void {
		if (
			LANDING_FEEDBACK_ENABLED &&
			player.landingImpact > LANDING_MIN_VELOCITY
		) {
			const impact = Math.min(
				LANDING_MAX_OFFSET,
				(player.landingImpact - LANDING_MIN_VELOCITY) * 0.008,
			);
			if (impact > 0) {
				this.landingOffset = Math.min(this.landingOffset, -impact);
			}
		}

		if (this.landingOffset < 0) {
			this.landingOffset += LANDING_RECOVERY_SPEED * delta;
			if (this.landingOffset > 0) {
				this.landingOffset = 0;
			}
		}
	}

	private updateFov(delta: number, player: PlayerState): void {
		const speedRatio = Math.min(player.horizontalSpeed / SPRINT_SPEED, 1);
		const sprinting =
			player.grounded &&
			!player.flying &&
			player.horizontalSpeed > WALK_SPEED + 0.25 &&
			speedRatio > 0.75;

		const targetFov = BASE_FOV + (sprinting ? SPRINT_FOV_ADDITION * speedRatio : 0);
		this.currentFov += (targetFov - this.currentFov) * Math.min(1, FOV_LERP_SPEED * delta);
	}
}
