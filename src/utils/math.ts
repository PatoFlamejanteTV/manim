import { vec3, mat4 } from 'gl-matrix';

// --- Type Definitions ---
export type Vector3 = vec3;

// --- Basic Math Utils ---

export function interpolate(start: number, end: number, alpha: number): number {
    return (1 - alpha) * start + alpha * end;
}

export function integerInterpolate(start: number, end: number, alpha: number): [number, number] {
    if (alpha >= 1) return [end - 1, 1.0];
    if (alpha <= 0) return [start, 0.0];
    const value = Math.floor(interpolate(start, end, alpha));
    const residue = ((end - start) * alpha) % 1;
    return [value, residue];
}

export function choose(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n / 2) k = n - k;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}

// --- Space Ops ---

export function getNorm(v: vec3): number {
    return vec3.length(v);
}

export function normalize(v: vec3): vec3 {
    const res = vec3.create();
    vec3.normalize(res, v);
    return res;
}

export function rotateVector(v: vec3, angle: number, axis: vec3 = vec3.fromValues(0, 0, 1)): vec3 {
    const res = vec3.create();
    const rot = mat4.create();
    mat4.fromRotation(rot, angle, axis);
    vec3.transformMat4(res, v, rot);
    return res;
}

// --- Bezier Curves ---

export function bezier(points: vec3[]): (t: number) => vec3 {
    const n = points.length - 1;
    return (t: number) => {
        const result = vec3.create();
        for (let k = 0; k <= n; k++) {
            const coeff = Math.pow(1 - t, n - k) * Math.pow(t, k) * choose(n, k);
            const term = vec3.create();
            vec3.scale(term, points[k], coeff);
            vec3.add(result, result, term);
        }
        return result;
    };
}

export function quadraticBezierPointsForArc(angle: number, nComponents: number): vec3[] {
    // Simplified version: just return points on the arc for now, without perfect handle placement
    // A real implementation needs the specific handle math from manimlib
    // But for now, let's approximate with points on the circle

    // Actually, to correctly implement VMobject, we need proper bezier handles.
    // P0 = (1, 0)
    // P2 = (cos(theta), sin(theta))
    // P1 is the handle.
    // For a circular arc, P1 is at distance 1/cos(theta/2) at angle theta/2

    const theta = angle / nComponents;
    const points: vec3[] = [];

    for (let i = 0; i < nComponents; i++) {
        const startAng = i * theta;
        const endAng = (i + 1) * theta;
        const midAng = (startAng + endAng) / 2;

        const p0 = vec3.fromValues(Math.cos(startAng), Math.sin(startAng), 0);
        const p2 = vec3.fromValues(Math.cos(endAng), Math.sin(endAng), 0);

        const rHandle = 1 / Math.cos(theta / 2);
        const p1 = vec3.fromValues(rHandle * Math.cos(midAng), rHandle * Math.sin(midAng), 0);

        if (i === 0) points.push(p0);
        points.push(p1);
        points.push(p2);
    }

    return points;
}

export function partialQuadraticBezierPoints(points: vec3[], a: number, b: number): vec3[] {
    // points is [p0, p1, p2]
    // returns [new_p0, new_p1, new_p2]

    if (a === 1.0) {
        return [points[2], points[2], points[2]];
    }
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];

    const curve = bezier([p0, p1, p2]);

    const h0 = a > 0 ? curve(a) : p0;
    const h2 = b < 1 ? curve(b) : p2;

    // h1_prime = (1-a)*p1 + a*p2
    const h1Prime = vec3.create();
    vec3.scaleAndAdd(h1Prime, vec3.create(), p1, 1 - a);
    vec3.scaleAndAdd(h1Prime, h1Prime, p2, a);

    const endProp = (b - a) / (1.0 - a);

    // h1 = (1-endProp)*h0 + endProp*h1Prime
    const h1 = vec3.create();
    vec3.scaleAndAdd(h1, vec3.create(), h0, 1 - endProp);
    vec3.scaleAndAdd(h1, h1, h1Prime, endProp);

    return [h0, h1, h2];
}
