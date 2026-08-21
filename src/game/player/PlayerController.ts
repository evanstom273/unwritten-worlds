import type { World } from '../voxel/World';
import {
	CROUCH_EYE_HEIGHT,
	CROUCH_HEIGHT,
	CROUCH_SPEED,
	DOUBLE_TAP_JUMP_MS,
	FLY_SPEED,
	FLY_VERTICAL_SPEED,
	GRAVITY,
	JUMP_VELOCITY,
	MAX_FALL_VELOCITY,
	PLAYER_EYE_HEIGHT,
	PLAYER_HEIGHT,
	SPRINT_SPEED,
	WALK_SPEED,
} from '../config/PlayerConfig';
import { LANDING_MIN_VELOCITY } from '../config/RenderConfig';
import type { InputState } from '../input/InputState';
import { resolveMovement } from './PlayerCollision';

export interface PlayerState {
	positionX: number;
	positionY: number;
	positionZ: number;
	velocityX: number;
	velocityY: number;
	velocityZ: number;
	grounded: boolean;
	airborne: boolean;
	movementMode: 'walk' | 'sprint' | 'crouch' | 'fly';
	horizontalSpeed: number;
	landingImpact: number;
	playerHeight: number;
	eyeHeight: number;
	flying: boolean;
	crouching: boolean;
}

export class PlayerController {
	private positionX: number;
	private positionY: number;
	private positionZ: number;
	private velocityX = 0;
	private velocityY = 0;
	private velocityZ = 0;
	private grounded = false;
	private flying = false;
	private crouching = false;
	private movementMode: PlayerState['movementMode'] = 'walk';
	private horizontalSpeed = 0;
	private landingImpact = 0;
	private previousVelocityY = 0;
	private lastJumpPressMs = 0;

	constructor(spawnX: number, spawnY: number, spawnZ: number) {
		this.positionX = spawnX;
		this.positionY = spawnY;
		this.positionZ = spawnZ;
	}

	update(delta: number, input: InputState, world: World, yaw: number, pitch: number): void {
		const wasGrounded = this.grounded;
		this.landingImpact = 0;

		if (input.jumpPressed) {
			const now = performance.now();
			if (now - this.lastJumpPressMs <= DOUBLE_TAP_JUMP_MS) {
				this.flying = !this.flying;
				this.velocityY = 0;
				this.lastJumpPressMs = 0;
			} else {
				this.lastJumpPressMs = now;
			}
		}

		this.crouching = !this.flying && input.crouch;
		const playerHeight = this.crouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;

		if (this.flying) {
			this.updateFlying(input, yaw, pitch);
		} else {
			this.updateGrounded(delta, input, yaw);
		}

		this.previousVelocityY = this.velocityY;

		const result = resolveMovement(
			world,
			this.positionX,
			this.positionY,
			this.positionZ,
			this.velocityX,
			this.velocityY,
			this.velocityZ,
			delta,
			playerHeight,
		);

		this.positionX = result.positionX;
		this.positionY = result.positionY;
		this.positionZ = result.positionZ;
		this.velocityX = result.velocityX;
		this.velocityY = result.velocityY;
		this.velocityZ = result.velocityZ;
		this.grounded = this.flying ? false : result.grounded;

		if (!wasGrounded && this.grounded && this.previousVelocityY < -LANDING_MIN_VELOCITY) {
			this.landingImpact = Math.abs(this.previousVelocityY);
		}
	}

	getState(): PlayerState {
		const playerHeight = this.crouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
		const eyeHeight = this.crouching ? CROUCH_EYE_HEIGHT : PLAYER_EYE_HEIGHT;

		return {
			positionX: this.positionX,
			positionY: this.positionY,
			positionZ: this.positionZ,
			velocityX: this.velocityX,
			velocityY: this.velocityY,
			velocityZ: this.velocityZ,
			grounded: this.grounded,
			airborne: !this.grounded && !this.flying,
			movementMode: this.movementMode,
			horizontalSpeed: this.horizontalSpeed,
			landingImpact: this.landingImpact,
			playerHeight,
			eyeHeight,
			flying: this.flying,
			crouching: this.crouching,
		};
	}

	private updateGrounded(delta: number, input: InputState, yaw: number): void {
		this.movementMode = this.crouching ? 'crouch' : input.sprint ? 'sprint' : 'walk';
		const speed = this.crouching ? CROUCH_SPEED : input.sprint ? SPRINT_SPEED : WALK_SPEED;

		this.applyPlanarMovement(input, yaw, speed);

		if (this.grounded) {
			if (input.jump) {
				this.velocityY = JUMP_VELOCITY;
				this.grounded = false;
			} else {
				this.velocityY = 0;
			}
		} else {
			this.velocityY -= GRAVITY * delta;
			if (this.velocityY < -MAX_FALL_VELOCITY) {
				this.velocityY = -MAX_FALL_VELOCITY;
			}
		}
	}

	private updateFlying(input: InputState, yaw: number, pitch: number): void {
		this.movementMode = 'fly';

		let moveX = input.moveX;
		let moveZ = input.moveZ;
		const moveLength = Math.hypot(moveX, moveZ);
		if (moveLength > 1) {
			moveX /= moveLength;
			moveZ /= moveLength;
		}

		const forwardX = -Math.sin(yaw) * Math.cos(pitch);
		const forwardY = -Math.sin(pitch);
		const forwardZ = -Math.cos(yaw) * Math.cos(pitch);
		const rightX = Math.cos(yaw);
		const rightZ = -Math.sin(yaw);

		const wishX = forwardX * moveZ + rightX * moveX;
		const wishY = forwardY * moveZ;
		const wishZ = forwardZ * moveZ + rightZ * moveX;

		this.velocityX = wishX * FLY_SPEED;
		this.velocityY = wishY * FLY_SPEED;
		this.velocityZ = wishZ * FLY_SPEED;

		if (input.jump) {
			this.velocityY = FLY_VERTICAL_SPEED;
		} else if (input.crouch) {
			this.velocityY = -FLY_VERTICAL_SPEED;
		}

		this.horizontalSpeed = Math.hypot(this.velocityX, this.velocityZ);
	}

	private applyPlanarMovement(input: InputState, yaw: number, speed: number): void {
		let moveX = input.moveX;
		let moveZ = input.moveZ;
		const moveLength = Math.hypot(moveX, moveZ);
		if (moveLength > 1) {
			moveX /= moveLength;
			moveZ /= moveLength;
		}

		const forwardX = -Math.sin(yaw);
		const forwardZ = -Math.cos(yaw);
		const rightX = Math.cos(yaw);
		const rightZ = -Math.sin(yaw);

		const wishX = forwardX * moveZ + rightX * moveX;
		const wishZ = forwardZ * moveZ + rightZ * moveX;

		this.velocityX = wishX * speed;
		this.velocityZ = wishZ * speed;
		this.horizontalSpeed = Math.hypot(this.velocityX, this.velocityZ);
	}
}
