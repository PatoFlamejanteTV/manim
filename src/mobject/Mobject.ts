import { vec3, mat4 } from 'gl-matrix';
import {
    DEFAULT_MOBJECT_COLOR,
    ORIGIN,
    RIGHT,
    UP,
    OUT,
    FRAME_X_RADIUS,
    FRAME_Y_RADIUS,
    DEFAULT_MOBJECT_TO_EDGE_BUFF,
    DEFAULT_MOBJECT_TO_MOBJECT_BUFF
} from '../constants';
import { hexToRgb, rgbToHex, Color } from '../utils/color';

// Type definitions
export type Vect3 = vec3;
// Basic simulation of numpy structured array for points + rgba
export interface PointData {
    point: Float32Array; // 3 floats
    rgba: Float32Array; // 4 floats
}

export class Mobject {
    dim: number = 3;
    color: Color;
    opacity: number;
    shading: [number, number, number];
    isFixedInFrame: boolean;
    depthTest: boolean;
    zIndex: number;

    // Internal state
    submobjects: Mobject[] = [];
    parents: Mobject[] = [];
    family: Mobject[] | null = [this];

    // Data (simplified from numpy structured array)
    // In JS we might use separate Float32Arrays for points and colors for better performance with WebGL
    // For this port, let's keep it conceptual.
    points: Float32Array; // Flattened x, y, z
    rgbas: Float32Array; // Flattened r, g, b, a

    uniforms: { [key: string]: any } = {};

    boundingBox: Float32Array = new Float32Array(6); // minX, minY, minZ, maxX, maxY, maxZ
    needsNewBoundingBox: boolean = true;

    updaters: ((mob: Mobject, dt: number) => void)[] = [];

    constructor(options: {
        color?: Color,
        opacity?: number,
        shading?: [number, number, number],
        isFixedInFrame?: boolean,
        depthTest?: boolean,
        zIndex?: number
    } = {}) {
        this.color = options.color || DEFAULT_MOBJECT_COLOR;
        this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
        this.shading = options.shading || [0.0, 0.0, 0.0];
        this.isFixedInFrame = options.isFixedInFrame || false;
        this.depthTest = options.depthTest || false;
        this.zIndex = options.zIndex || 0;

        this.points = new Float32Array(0);
        this.rgbas = new Float32Array(0);

        this.initUniforms();
        this.initPoints();
        this.initColors();
    }

    initUniforms() {
        this.uniforms = {
            is_fixed_in_frame: 0.0,
            shading: [...this.shading],
            clip_plane: new Float32Array(4)
        };
    }

    initPoints() {
        // To be implemented by subclasses
    }

    initColors() {
        this.setColor(this.color, this.opacity);
    }

    add(...mobjects: Mobject[]): this {
        for (const mobject of mobjects) {
            if (mobject === this) throw new Error("Mobject cannot contain self");

            // Prevent cycles (adding an ancestor as a child)
            if (mobject.getFamily(true).includes(this)) {
                throw new Error("Mobject cannot create cyclic family relationships");
            }

            if (!this.submobjects.includes(mobject)) {
                this.submobjects.push(mobject);
            }
            if (!mobject.parents.includes(this)) {
                mobject.parents.push(this);
            }
        }
        this.noteChangedFamily();
        return this;
    }

    remove(...mobjects: Mobject[]): this {
        for (const mobject of mobjects) {
            const index = this.submobjects.indexOf(mobject);
            if (index > -1) {
                this.submobjects.splice(index, 1);
            }
            const parentIndex = mobject.parents.indexOf(this);
            if (parentIndex > -1) {
                mobject.parents.splice(parentIndex, 1);
            }
        }
        this.noteChangedFamily();
        return this;
    }

    noteChangedFamily(): this {
        this.family = null;
        this.needsNewBoundingBox = true;
        for (const parent of this.parents) {
            parent.noteChangedFamily();
        }
        return this;
    }

    getFamily(recurse: boolean = true): Mobject[] {
        if (!recurse) return [this];
        if (this.family === null) {
            this.family = [this];
            for (const sm of this.submobjects) {
                this.family.push(...sm.getFamily());
            }
        }
        return this.family;
    }

    // Points manipulation

    resizePoints(newLength: number): this {
        const currentLength = this.points.length / 3;
        if (newLength === currentLength) return this;

        const newPoints = new Float32Array(newLength * 3);
        const newRgbas = new Float32Array(newLength * 4);

        // Very basic resizing: copy existing, fill rest with last value or 0
        if (currentLength > 0) {
            const copyLen = Math.min(currentLength, newLength);
            newPoints.set(this.points.subarray(0, copyLen * 3));
            newRgbas.set(this.rgbas.subarray(0, copyLen * 4));

            // If expanding, replicate last point
            if (newLength > currentLength) {
               // ... (omitted complex resizing logic for now)
            }
        }

        this.points = newPoints;
        this.rgbas = newRgbas;
        this.needsNewBoundingBox = true;
        return this;
    }

    setPoints(points: vec3[]): this {
        this.resizePoints(points.length);
        for (let i = 0; i < points.length; i++) {
            this.points[i * 3] = points[i][0];
            this.points[i * 3 + 1] = points[i][1];
            this.points[i * 3 + 2] = points[i][2];
        }
        this.needsNewBoundingBox = true;
        return this;
    }

    getPoints(): vec3[] {
        const res: vec3[] = [];
        for (let i = 0; i < this.points.length / 3; i++) {
            res.push(vec3.fromValues(
                this.points[i * 3],
                this.points[i * 3 + 1],
                this.points[i * 3 + 2]
            ));
        }
        return res;
    }

    getNumPoints(): number {
        return this.points.length / 3;
    }

    applyPointsFunction(func: (p: vec3) => vec3, aboutPoint?: vec3): this {
        const numPoints = this.getNumPoints();
        for (let i = 0; i < numPoints; i++) {
            const p = vec3.fromValues(
                this.points[i * 3],
                this.points[i * 3 + 1],
                this.points[i * 3 + 2]
            );

            let newP: vec3;
            if (aboutPoint) {
                 const diff = vec3.create();
                 vec3.subtract(diff, p, aboutPoint);
                 newP = func(diff);
                 vec3.add(newP, newP, aboutPoint);
            } else {
                newP = func(p);
            }

            this.points[i * 3] = newP[0];
            this.points[i * 3 + 1] = newP[1];
            this.points[i * 3 + 2] = newP[2];
        }

        // Also apply to submobjects? In python version, it applies to family.
        // Simplified here:
        for(const sm of this.submobjects) {
            sm.applyPointsFunction(func, aboutPoint);
        }

        this.needsNewBoundingBox = true;
        return this;
    }

    // Transforms

    shift(vector: vec3): this {
        return this.applyPointsFunction(p => {
            const res = vec3.create();
            vec3.add(res, p, vector);
            return res;
        });
    }

    scale(factor: number, aboutPoint?: vec3): this {
        // Default aboutPoint to center if not provided
        if (!aboutPoint) {
            aboutPoint = this.getCenter();
        }

        return this.applyPointsFunction(p => {
            const res = vec3.create();
            vec3.scale(res, p, factor);
            return res;
        }, aboutPoint);
    }

    rotate(angle: number, axis: vec3 = OUT, aboutPoint?: vec3): this {
        if (!aboutPoint) {
            aboutPoint = this.getCenter();
        }
        const rotMatrix = mat4.create();
        mat4.fromRotation(rotMatrix, angle, axis);

        return this.applyPointsFunction(p => {
             const res = vec3.create();
             vec3.transformMat4(res, p, rotMatrix);
             return res;
        }, aboutPoint);
    }

    // Coloring

    setColor(color: Color, opacity: number = 1.0): this {
        this.color = color;
        this.opacity = opacity;
        const rgb = hexToRgb(color);
        const numPoints = this.getNumPoints();
        for (let i = 0; i < numPoints; i++) {
            this.rgbas[i * 4] = rgb[0];
            this.rgbas[i * 4 + 1] = rgb[1];
            this.rgbas[i * 4 + 2] = rgb[2];
            this.rgbas[i * 4 + 3] = opacity;
        }
        // Propagate to submobjects
        for (const sm of this.submobjects) {
            sm.setColor(color, opacity);
        }
        return this;
    }

    // Bounding Box

    getBoundingBox(): Float32Array {
        if (this.needsNewBoundingBox) {
            this.computeBoundingBox();
        }
        return this.boundingBox;
    }

    computeBoundingBox() {
        // Initialize with infinity
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        const processPoints = (mob: Mobject) => {
             const pts = mob.points;
             for (let i = 0; i < pts.length; i+=3) {
                 const x = pts[i];
                 const y = pts[i+1];
                 const z = pts[i+2];
                 if (x < minX) minX = x;
                 if (y < minY) minY = y;
                 if (z < minZ) minZ = z;
                 if (x > maxX) maxX = x;
                 if (y > maxY) maxY = y;
                 if (z > maxZ) maxZ = z;
             }
             for(const sm of mob.submobjects) {
                 processPoints(sm);
             }
        }

        processPoints(this);

        if (minX === Infinity) {
            // No points
            minX = minY = minZ = maxX = maxY = maxZ = 0;
        }

        this.boundingBox[0] = minX;
        this.boundingBox[1] = minY;
        this.boundingBox[2] = minZ;
        this.boundingBox[3] = maxX;
        this.boundingBox[4] = maxY;
        this.boundingBox[5] = maxZ;

        this.needsNewBoundingBox = false;
    }

    getCenter(): vec3 {
        const bb = this.getBoundingBox();
        return vec3.fromValues(
            (bb[0] + bb[3]) / 2,
            (bb[1] + bb[4]) / 2,
            (bb[2] + bb[5]) / 2
        );
    }

    getWidth(): number {
        const bb = this.getBoundingBox();
        return bb[3] - bb[0];
    }

    getHeight(): number {
        const bb = this.getBoundingBox();
        return bb[4] - bb[1];
    }

    // Updaters

    addUpdater(updater: (mob: Mobject, dt: number) => void): this {
        this.updaters.push(updater);
        return this;
    }

    update(dt: number = 0): this {
        for (const updater of this.updaters) {
            updater(this, dt);
        }
        for (const sm of this.submobjects) {
            sm.update(dt);
        }
        return this;
    }
}
