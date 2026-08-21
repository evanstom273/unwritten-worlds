import type { World } from '../voxel/World';
import {
	GRAVITY,
	JUMP_VELOCITY,
	MAX_FALL_VELOCITY,
	SPRINT_SPEED,
	WALK_SPEED,
} from '../config/PlayerConfig';
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
	movementMode: 'walk' | 'sprint';
}

export class PlayerController {
	private positionX: number;
	private positionY: number;
	private positionZ: number;
	private velocityX = 0;
	private velocityY = 0;
	private velocityZ = 0;
	private grounded = false;
	private movementMode: 'walk' | 'sprint' = 'walk';

	constructor(spawnX: number, spawnY: number, spawnZ: number) {
		this.positionX = spawnX;
		this.positionY = spawnY;
		this.positionZ = spawnZ;
	}

	update(delta: number, input: InputState, world: World, yaw: number): void {
		this.movementMode = input.sprint ? 'sprint' : 'walk';
		const speed = input.sprint ? SPRINT_SPEED : WALK_SPEED;

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

		const result = resolveMovement(
			world,
			this.positionX,
			this.positionY,
			this.positionZ,
			this.velocityX,
			this.velocityY,
			this.velocityZ,
			delta,
		);

		this.positionX = result.positionX;
		this.positionY = result.positionY;
		this.positionZ = result.positionZ;
		this.velocityX = result.velocityX;
		this.velocityY = result.velocityY;
		this.velocityZ = result.velocityZ;
		this.grounded = result.grounded;
	}

	getState(): PlayerState {
		return {
			positionX: this.positionX,
			positionY: this.positionY,
			positionZ: this.positionZ,
			velocityX: this.velocityX,
			velocityY: this.velocityY,
			velocityZ: this.velocityZ,
			grounded: this.grounded,
			movementMode: this.movementMode,
		};
	}
}
