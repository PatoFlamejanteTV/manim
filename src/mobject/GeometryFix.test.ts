import { Ellipse, Line } from './Geometry';
import { vec3 } from 'gl-matrix';

describe('Geometry Bugfixes', () => {
    test('Ellipse non-uniform scaling', () => {
        const ellipse = new Ellipse({ width: 4, height: 2 });
        expect(ellipse.getWidth()).toBeCloseTo(4, 1);
        expect(ellipse.getHeight()).toBeCloseTo(2, 1);

        const pts = ellipse.getPoints();
        // Check a point on X axis (start/end)
        // With radius 1, start is (1,0). Scaled by 2 (w/2) -> (2,0).
        // Bezier points might vary slightly but width should hold.

        // Check bounding box directly
        const bb = ellipse.getBoundingBox();
        expect(bb[3] - bb[0]).toBeCloseTo(4, 1); // Width
        expect(bb[4] - bb[1]).toBeCloseTo(2, 1); // Height
    });

    test('Line buffer clamping', () => {
        const start = vec3.fromValues(0, 0, 0);
        const end = vec3.fromValues(10, 0, 0);

        // Case 1: Excessive buff
        const line = new Line(start, end, { buff: 20 });
        // Should clamp buff to 5 (length/2).
        // Start should be (5,0,0), End (5,0,0). Length 0.
        expect(line.getLength()).toBeCloseTo(0);

        const p = line.getPoints();
        expect(p[0][0]).toBeCloseTo(5);
        expect(p[p.length-1][0]).toBeCloseTo(5);

        // Case 2: Normal buff
        const line2 = new Line(start, end, { buff: 1 });
        expect(line2.getLength()).toBeCloseTo(8);
    });
});
