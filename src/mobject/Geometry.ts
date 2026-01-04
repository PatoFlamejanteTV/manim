import { VMobject } from './VMobject';
import { vec3 } from 'gl-matrix';
import {
    quadraticBezierPointsForArc,
    rotateVector,
    interpolate
} from '../utils/math';
import { ORIGIN, RIGHT, TAU, PI, UP, DEGREES } from '../constants';
import { Color } from '../utils/color';

// --- Arc ---

export class Arc extends VMobject {
    constructor(options: {
        startAngle?: number,
        angle?: number,
        radius?: number,
        arcCenter?: vec3,
        nComponents?: number,
        color?: Color,
        strokeWidth?: number
    } = {}) {
        super(options);

        const startAngle = options.startAngle || 0;
        const angle = options.angle !== undefined ? options.angle : TAU / 4;
        const radius = options.radius !== undefined ? options.radius : 1.0;
        const arcCenter = options.arcCenter || ORIGIN;

        if (radius <= 0) throw new Error("Arc radius must be positive");

        // Approximate nComponents if not provided
        const nComponents = options.nComponents || Math.ceil(8 * Math.abs(angle) / TAU) || 1;

        if (nComponents <= 0) throw new Error("Arc nComponents must be positive");

        const points = quadraticBezierPointsForArc(angle, nComponents);

        // Setup initial points
        this.setPoints(points);

        // Transform to desired position/shape
        // 1. Rotate to start angle (currently starts at 0)
        // 2. Scale by radius
        // 3. Shift to center

        this.rotate(startAngle, vec3.fromValues(0, 0, 1), ORIGIN);
        this.scale(radius, ORIGIN);
        this.shift(arcCenter);
    }
}

// --- Circle ---

export class Circle extends Arc {
    constructor(options: {
        radius?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number,
        strokeWidth?: number,
        arcCenter?: vec3
    } = {}) {
        super({
            startAngle: 0,
            angle: TAU,
            radius: options.radius,
            arcCenter: options.arcCenter,
            color: options.color,
            strokeWidth: options.strokeWidth
        });

        if (options.fillColor || options.fillOpacity) {
            this.setFill({
                color: options.fillColor,
                opacity: options.fillOpacity
            });
        }
    }
}

// --- Line ---

export class Line extends VMobject {
    constructor(
        start: vec3 = vec3.fromValues(-1, 0, 0),
        end: vec3 = vec3.fromValues(1, 0, 0),
        options: {
            color?: Color,
            strokeWidth?: number
        } = {}
    ) {
        super(options);
        this.startNewPath(start);
        this.addLineTo(end);
    }
}

// --- Rectangle ---

export class Rectangle extends VMobject {
    constructor(options: {
        width?: number,
        height?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number,
        strokeWidth?: number
    } = {}) {
        super(options);
        const width = options.width || 4.0;
        const height = options.height || 2.0;

        if (width <= 0) throw new Error("Rectangle width must be positive");
        if (height <= 0) throw new Error("Rectangle height must be positive");

        const w2 = width / 2;
        const h2 = height / 2;

        // UL, DL, DR, UR
        // Note: Manim typically goes UL -> DL -> DR -> UR -> UL

        const ur = vec3.fromValues(w2, h2, 0);
        const ul = vec3.fromValues(-w2, h2, 0);
        const dl = vec3.fromValues(-w2, -h2, 0);
        const dr = vec3.fromValues(w2, -h2, 0);

        this.startNewPath(ul);
        this.addLineTo(dl);
        this.addLineTo(dr);
        this.addLineTo(ur);
        this.addLineTo(ul); // Close loop

        if (options.fillColor || options.fillOpacity) {
             this.setFill({
                color: options.fillColor,
                opacity: options.fillOpacity
            });
        }
    }
}

// --- Square ---

export class Square extends Rectangle {
    constructor(options: {
        sideLength?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number
    } = {}) {
        const side = options.sideLength || 2.0;
        if (side <= 0) throw new Error("Square side length must be positive");
        super({
            width: side,
            height: side,
            color: options.color,
            fillColor: options.fillColor,
            fillOpacity: options.fillOpacity
        });
    }
}
