import { vec3, vec4 } from 'gl-matrix';
import { Mobject, PointData } from './Mobject';
import { Color, hexToRgb } from '../utils/color';
import { bezier, partialQuadraticBezierPoints } from '../utils/math';
import { DEFAULT_MOBJECT_COLOR } from '../constants';

export class VMobject extends Mobject {
    // Stroke and Fill
    strokeColor: Color;
    strokeOpacity: number;
    strokeWidth: number;

    fillColor: Color;
    fillOpacity: number;

    // In Node/WebGL, we separate data.
    // Mobject has `points` and `rgbas`.
    // VMobject needs specific stroke/fill data per point or globally?
    // Manim stores stroke/fill info in the numpy array per point (actually per curve vertex).
    // For this port, we will store them as properties of the object for simplicity,
    // unless we need per-point coloring (gradients).

    constructor(options: {
        color?: Color,
        strokeColor?: Color,
        strokeOpacity?: number,
        strokeWidth?: number,
        fillColor?: Color,
        fillOpacity?: number,
    } = {}) {
        super(options);

        const color = options.color || DEFAULT_MOBJECT_COLOR;

        this.strokeColor = options.strokeColor || color;
        this.strokeOpacity = options.strokeOpacity !== undefined ? options.strokeOpacity : 1.0;
        this.strokeWidth = options.strokeWidth !== undefined ? options.strokeWidth : 4.0; // Default width

        this.fillColor = options.fillColor || color;
        this.fillOpacity = options.fillOpacity !== undefined ? options.fillOpacity : 0.0;

        this.initColors();
    }

    initColors() {
        super.initColors();
        // Here we would sync properties to underlying data arrays if we were doing full WebGL compat
    }

    // --- Curve Manipulation ---

    startNewPath(point: vec3): this {
        if (this.getNumPoints() > 0) {
            // If we already have points, we need to handle the discontinuity.
            // In Manim, this is often handled by adding a duplicate point or careful indexing.
            // For this port, let's assume `points` is a continuous list of bezier anchors/handles.
            // A new path might mean we need a separate structure or a "move to" command.
            // Manim uses handle sitting on top of anchor to signal break.
            const last = this.getLastPoint();
            this.addPoints([last, last, point]);
        } else {
            this.setPoints([point]);
        }
        return this;
    }

    addQuadraticBezierCurveTo(handle: vec3, anchor: vec3): this {
        this.addPoints([handle, anchor]);
        return this;
    }

    addCubicBezierCurveTo(handle1: vec3, handle2: vec3, anchor: vec3): this {
        // Approximate cubic with quadratics? Or support cubic?
        // ManimGL mostly uses quadratics for rendering performance.
        // It approximates cubic with quadratics.
        // For this port, let's just store the points. If we render, we decide how to interpret them.
        // However, standard VMobject expectation is 3 points per curve (anchor, handle, anchor).
        // If we want to support cubic inputs, we should convert them.

        // TODO: Implement `getQuadraticApproximationOfCubic`
        // For now, let's just assume we can store them or simplify.
        // Let's fallback to a straight line or simple quadratic for the MVP.
        const last = this.getLastPoint();
        const mid = vec3.create();
        vec3.lerp(mid, handle1, handle2, 0.5); // Very rough approx
        this.addQuadraticBezierCurveTo(mid, anchor);

        return this;
    }

    addLineTo(point: vec3): this {
        const last = this.getLastPoint();
        const mid = vec3.create();
        vec3.lerp(mid, last, point, 0.5);
        this.addQuadraticBezierCurveTo(mid, point);
        return this;
    }

    addPoints(newPoints: vec3[]): this {
        // VMobject points structure: [Anchor, Handle, Anchor, Handle, Anchor ...]
        // Every curve is 3 points: StartAnchor, Handle, EndAnchor.
        // But StartAnchor is the EndAnchor of previous.
        // So storage is: P0, H0, P1, H1, P2 ...
        // Wait, ManimGL uses Quadratic Bezier mostly.
        // Storage: [A0, H0, A1, H1, A2 ...]
        // Curve i is points[2*i], points[2*i+1], points[2*i+2]

        const currentLen = this.getNumPoints();
        const ptsToAdd = [...newPoints];

        // If we are appending to existing points, ensure continuity logic
        if (currentLen > 0) {
            // simple append
        }

        // Resize and set
        const totalPoints = currentLen + ptsToAdd.length;
        this.resizePoints(totalPoints);

        for(let i=0; i<ptsToAdd.length; i++) {
            const idx = currentLen + i;
            const p = ptsToAdd[i];
            this.points[idx*3] = p[0];
            this.points[idx*3+1] = p[1];
            this.points[idx*3+2] = p[2];
        }

        return this;
    }

    getLastPoint(): vec3 {
        if (this.getNumPoints() === 0) return vec3.create(); // Origin
        const idx = this.getNumPoints() - 1;
        return vec3.fromValues(
            this.points[idx*3],
            this.points[idx*3+1],
            this.points[idx*3+2]
        );
    }

    // --- Style Setters ---

    setStroke(options: {color?: Color, width?: number, opacity?: number}): this {
        if (options.color) this.strokeColor = options.color;
        if (options.width !== undefined) this.strokeWidth = options.width;
        if (options.opacity !== undefined) this.strokeOpacity = options.opacity;
        return this;
    }

    setFill(options: {color?: Color, opacity?: number}): this {
        if (options.color) this.fillColor = options.color;
        if (options.opacity !== undefined) this.fillOpacity = options.opacity;
        return this;
    }

    // --- Geometry Info ---

    getPoints(): vec3[] {
        return super.getPoints();
    }

    getNumCurves(): number {
        return Math.floor((this.getNumPoints() - 1) / 2);
    }

    getNthCurvePoints(n: number): vec3[] {
        const points = this.getPoints();
        return [
            points[2 * n],
            points[2 * n + 1],
            points[2 * n + 2]
        ];
    }

    pointFromProportion(alpha: number): vec3 {
        const numCurves = this.getNumCurves();
        if (numCurves === 0) return vec3.create();

        // Find which curve alpha falls into
        // Simplification: assume uniform distribution of alpha along curves
        // Real Manim uses arc length parameterization

        const val = alpha * numCurves;
        let curveIdx = Math.floor(val);
        let subAlpha = val % 1;

        if (alpha >= 1) {
            curveIdx = numCurves - 1;
            subAlpha = 1;
        }

        const curvePoints = this.getNthCurvePoints(curveIdx);
        const curveFunc = bezier(curvePoints);
        return curveFunc(subAlpha);
    }
}
