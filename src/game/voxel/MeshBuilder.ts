import * as THREE from 'three';

const INITIAL_VERTEX_CAPACITY = 4096;

export class MeshBuilder {
	private positions: Float32Array;
	private uvs: Float32Array;
	private vertexCount = 0;

	constructor() {
		this.positions = new Float32Array(INITIAL_VERTEX_CAPACITY * 3);
		this.uvs = new Float32Array(INITIAL_VERTEX_CAPACITY * 2);
	}

	reset(): void {
		this.vertexCount = 0;
	}

	getFaceCount(): number {
		return this.vertexCount / 6;
	}

	getTriangleCount(): number {
		return this.vertexCount / 3;
	}

	addFace(
		x0: number,
		y0: number,
		z0: number,
		x1: number,
		y1: number,
		z1: number,
		x2: number,
		y2: number,
		z2: number,
		x3: number,
		y3: number,
		z3: number,
		u0: number,
		v0: number,
		u1: number,
		v1: number,
		u2: number,
		v2: number,
		u3: number,
		v3: number,
	): void {
		this.ensureCapacity(6);

		this.writeVertex(x0, y0, z0, u0, v0);
		this.writeVertex(x1, y1, z1, u1, v1);
		this.writeVertex(x2, y2, z2, u2, v2);
		this.writeVertex(x0, y0, z0, u0, v0);
		this.writeVertex(x2, y2, z2, u2, v2);
		this.writeVertex(x3, y3, z3, u3, v3);
	}

	buildGeometry(): THREE.BufferGeometry | null {
		if (this.vertexCount === 0) {
			return null;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(this.positions.slice(0, this.vertexCount * 3), 3),
		);
		geometry.setAttribute(
			'uv',
			new THREE.BufferAttribute(this.uvs.slice(0, this.vertexCount * 2), 2),
		);
		geometry.computeVertexNormals();
		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();

		return geometry;
	}

	private ensureCapacity(additionalVertices: number): void {
		const required = this.vertexCount + additionalVertices;
		if (required <= this.positions.length / 3) {
			return;
		}

		const newCapacity = Math.max(required, (this.positions.length / 3) * 2);
		const newPositions = new Float32Array(newCapacity * 3);
		const newUvs = new Float32Array(newCapacity * 2);
		newPositions.set(this.positions.subarray(0, this.vertexCount * 3));
		newUvs.set(this.uvs.subarray(0, this.vertexCount * 2));
		this.positions = newPositions;
		this.uvs = newUvs;
	}

	private writeVertex(x: number, y: number, z: number, u: number, v: number): void {
		const index = this.vertexCount;
		const positionIndex = index * 3;
		const uvIndex = index * 2;
		this.positions[positionIndex] = x;
		this.positions[positionIndex + 1] = y;
		this.positions[positionIndex + 2] = z;
		this.uvs[uvIndex] = u;
		this.uvs[uvIndex + 1] = v;
		this.vertexCount++;
	}
}
