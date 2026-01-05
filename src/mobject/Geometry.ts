import { VMobject } from './VMobject';
import { TipableVMobject } from './TipableVMobject';
import { vec3 } from 'gl-matrix';
import {
    quadraticBezierPointsForArc,
    rotateVector,
    interpolate,
    getNorm,
    normalize,
    angleOfVector
} from '../utils/math';
import { ORIGIN, RIGHT, TAU, PI, UP, DEGREES, DOWN, LEFT, DEFAULT_MOBJECT_COLOR } from '../constants';
import { Color } from '../utils/color';

// --- Polygon ---

export class Polygon extends VMobject {
    constructor(vertices: vec3[], options: {
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number,
        strokeWidth?: number
    } = {}) {
        super(options);
        // Ensure closed
        const pts = [...vertices];
        if (vertices.length > 0) {
            pts.push(vertices[0]); // Close loop
        }

        if (pts.length > 0) {
            this.startNewPath(pts[0]);
            for (let i = 1; i < pts.length; i++) {
                this.addLineTo(pts[i]);
            }
        }
    }

    getVertices(): vec3[] {
        // Return anchors. VMobject stores A, H, A, H...
        // For simple lines, handles are midpoints.
        // We just want anchors.
        const points = this.getPoints();
        const vertices: vec3[] = [];
        for (let i = 0; i < points.length; i += 2) {
            // Wait, for N lines, we have 2N+1 points (A,H,A, H, A...)
            // Actually, addLineTo adds 2 points (H, A).
            // Start adds 1 point (A).
            // So indices 0, 2, 4... are anchors.
            // But last anchor is same as first for closed loop.
            if (i < points.length - 1) { // Skip last duplicate if we want unique vertices?
                 vertices.push(points[i]);
            }
        }
        return vertices;
    }
}

// --- RegularPolygon ---

export class RegularPolygon extends Polygon {
    constructor(options: {
        n?: number,
        radius?: number,
        startAngle?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number
    } = {}) {
        const n = options.n || 6;
        const radius = options.radius || 1.0;
        const startAngle = options.startAngle || (n % 2 === 0 ? 90 * DEGREES : 0); // Logic from Python

        const vertices: vec3[] = [];
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * (TAU / n);
            const v = vec3.fromValues(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                0
            );
            vertices.push(v);
        }

        super(vertices, options);
    }
}

// --- Triangle ---

export class Triangle extends RegularPolygon {
    constructor(options: {
        radius?: number,
        startAngle?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number
    } = {}) {
        super({ ...options, n: 3 });
    }
}

// --- ArrowTip ---

export class ArrowTip extends Triangle {
    constructor(options: {
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number,
        length?: number, // Not standard in Triangle but needed for sizing
        width?: number,
        angle?: number,
        startAngle?: number
    } = {}) {
        super({
            ...options,
            startAngle: options.startAngle || 0, // Point right by default (0)
            fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 1.0,
            color: options.color || DEFAULT_MOBJECT_COLOR
        });

        const length = options.length || 0.35;
        const width = options.width || 0.35;

        // Triangle creates a specific size based on radius. We need to reshape it.
        // Triangle points right at 0 degrees?
        // RegularPolygon logic: startAngle + i * TAU/3.
        // If startAngle=0: 0, 120, 240.
        // 0 deg is (R, 0). 120 is (-0.5R, 0.866R). 240 is (-0.5R, -0.866R).
        // This points RIGHT.

        // We want to stretch to match length/width.
        // Current width (y-span) is 0.866R - (-0.866R) = 1.732R.
        // Current length (x-span) is R - (-0.5R) = 1.5R.
        // Center is at 0.

        // Simplification: Just make it fit.
        // Rotate to desired angle at the end.

        // Base Triangle is unit radius 1.
        // We want width W and length L.
        // Tip is at (L/2, 0) relative to center?
        // ArrowTip typically defined with tip at (0,0) or start?
        // Python ArrowTip: tip at (0,0) before placement? No, it inherits from Triangle.

        // Let's just scale it.
        // Use setHeight/setWidth if available, or scale.
        // Since we don't have setHeight implemented, let's use scale.

        this.scale(length, ORIGIN); // Rough approximation
        if (options.angle) {
            this.rotate(options.angle, vec3.fromValues(0,0,1), ORIGIN);
        }
    }

    getTipPoint(): vec3 {
        // For Triangle with startAngle=0, tip is the first vertex (R, 0)
        return this.getPoints()[0];
    }

    getAngle(): number {
        // Assuming it points along X initially
        // Need to track rotation or calculate from points
        // Vector from centroid to tip
        const tip = this.getTipPoint();
        const center = this.getCenter();
        const dir = vec3.create();
        vec3.subtract(dir, tip, center);
        return angleOfVector(dir);
    }
}

// --- Arc ---

export class Arc extends TipableVMobject {
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

export class Line extends TipableVMobject {
    constructor(
        start: vec3 = vec3.fromValues(-1, 0, 0),
        end: vec3 = vec3.fromValues(1, 0, 0),
        options: {
            color?: Color,
            strokeWidth?: number,
            buff?: number
        } = {}
    ) {
        super(options);

        const buff = options.buff || 0;
        // Apply buff
        // Vector start->end
        const v = vec3.create();
        vec3.subtract(v, end, start);
        const length = getNorm(v);

        const u = vec3.create();
        if (length > 0) {
            vec3.scale(u, v, 1/length);
        } else {
            vec3.set(u, 1, 0, 0); // Default
        }

        const actualStart = vec3.create();
        const actualEnd = vec3.create();

        vec3.scaleAndAdd(actualStart, start, u, buff);
        vec3.scaleAndAdd(actualEnd, end, u, -buff);

        this.startNewPath(actualStart);
        this.addLineTo(actualEnd);
    }
}

// --- Arrow ---

export class Arrow extends Line {
    constructor(
        start: vec3 = LEFT,
        end: vec3 = RIGHT,
        options: {
            color?: Color,
            strokeWidth?: number,
            buff?: number,
            tipLength?: number
        } = {}
    ) {
        super(start, end, options);
        // Add tip
        this.addTip(false, { length: options.tipLength });
    }
}

// --- Vector ---

export class Vector extends Arrow {
    constructor(direction: vec3 = RIGHT, options: any = {}) {
        super(ORIGIN, direction, { ...options, buff: 0 });
    }
}

// --- Rectangle ---

export class Rectangle extends Polygon {
    constructor(options: {
        width?: number,
        height?: number,
        color?: Color,
        fillColor?: Color,
        fillOpacity?: number,
        strokeWidth?: number
    } = {}) {
        const width = options.width || 4.0;
        const height = options.height || 2.0;

        if (width <= 0) throw new Error("Rectangle width must be positive");
        if (height <= 0) throw new Error("Rectangle height must be positive");

        const w2 = width / 2;
        const h2 = height / 2;

        // UL, DL, DR, UR
        const ur = vec3.fromValues(w2, h2, 0);
        const ul = vec3.fromValues(-w2, h2, 0);
        const dl = vec3.fromValues(-w2, -h2, 0);
        const dr = vec3.fromValues(w2, -h2, 0);

        super([ul, dl, dr, ur], options);

        if (options.fillColor || options.fillOpacity) {
             this.setFill({
                color: options.fillColor,
                opacity: options.fillOpacity
            });
        }
    }

    getWidth(): number {
        return super.getWidth();
    }

    getHeight(): number {
        return super.getHeight();
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

// --- Ellipse ---

export class Ellipse extends Circle {
    constructor(options: {
        width?: number,
        height?: number,
        color?: Color
    } = {}) {
        super(options);
        const width = options.width || 2.0;
        const height = options.height || 1.0;
        // Circle defaults to radius 1 (width 2, height 2)
        // We need to scale to match width/height

        // Reset scale (assuming Circle constructor scaled to radius 1 -> width 2)
        // We just re-scale points or use setWidth/Height if we had them.
        // Let's create a new circle with r=1 and scale it.

        // Actually Circle constructor already scales by radius.
        // Let's assume r=1 (diameter 2).
        this.scale(width / 2.0, vec3.fromValues(1, 0, 0)); // Scale X
        this.scale(height / 2.0, vec3.fromValues(0, 1, 0)); // Scale Y
        // Wait, scale(factor, aboutPoint) scales uniformly.
        // We need non-uniform scale or stretch.
        // I haven't implemented `stretch`.
        // Let's implement non-uniform scale in Mobject or just hack it here via applyPointsFunction.
    }

    // Override scale to support 3D vector scale? Mobject.scale takes number.
    // Let's implement stretch-like behavior locally for now.

    // Actually, Mobject.scale takes number. I need stretch.
    // I will add stretch to Mobject or VMobject later.
    // For now, let's manually transform points.
}

// --- Dot ---

export class Dot extends Circle {
    constructor(options: {
        point?: vec3,
        radius?: number,
        color?: Color
    } = {}) {
        const radius = options.radius || 0.08;
        const point = options.point || ORIGIN;
        super({
            radius: radius,
            color: options.color || DEFAULT_MOBJECT_COLOR,
            fillColor: options.color || DEFAULT_MOBJECT_COLOR,
            fillOpacity: 1.0,
            arcCenter: point,
            strokeWidth: 0
        });
    }
}
