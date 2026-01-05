import { vec3 } from 'gl-matrix';
import { interpolate, choose, bezier, quadraticBezierPointsForArc } from './math';

describe('Math Utils', () => {
    test('interpolate', () => {
        expect(interpolate(0, 10, 0.5)).toBe(5);
        expect(interpolate(10, 20, 0.1)).toBe(11);
    });

    test('choose', () => {
        expect(choose(5, 2)).toBe(10);
        expect(choose(4, 0)).toBe(1);
        expect(choose(4, 4)).toBe(1);
    });

    test('bezier', () => {
        const p0 = vec3.fromValues(0, 0, 0);
        const p1 = vec3.fromValues(1, 1, 0);
        const p2 = vec3.fromValues(2, 0, 0);

        const curve = bezier([p0, p1, p2]);

        const mid = curve(0.5);
        expect(mid[0]).toBeCloseTo(1);
        expect(mid[1]).toBeCloseTo(0.5);
        expect(mid[2]).toBeCloseTo(0);

        const start = curve(0);
        expect(start[0]).toBeCloseTo(0);

        const end = curve(1);
        expect(end[0]).toBeCloseTo(2);
    });

    test('quadraticBezierPointsForArc', () => {
        const points = quadraticBezierPointsForArc(Math.PI / 2, 1);
        // Should have 3 points: start, handle, end
        expect(points.length).toBe(3);

        // Start at (1,0)
        expect(points[0][0]).toBeCloseTo(1);
        expect(points[0][1]).toBeCloseTo(0);

        // End at (0,1)
        expect(points[2][0]).toBeCloseTo(0);
        expect(points[2][1]).toBeCloseTo(1);

        // Handle should be at (1,1)
        expect(points[1][0]).toBeCloseTo(1);
        expect(points[1][1]).toBeCloseTo(1);
    });
});
