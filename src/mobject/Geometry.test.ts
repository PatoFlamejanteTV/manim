import { Arc, Circle, Line, Rectangle, Square } from './Geometry';
import { vec3 } from 'gl-matrix';
import { TAU } from '../constants';

describe('Geometry Mobjects', () => {
    test('Line initialization', () => {
        const start = vec3.fromValues(1, 1, 1);
        const end = vec3.fromValues(2, 2, 2);
        const line = new Line(start, end);

        expect(line.getNumPoints()).toBeGreaterThan(0);
        const points = line.getPoints();
        expect(points[0]).toEqual(start);
        expect(points[points.length - 1]).toEqual(end);
    });

    test('Circle points and radius', () => {
        const circle = new Circle({ radius: 2 });
        expect(circle.getWidth()).toBeCloseTo(4.0, 1); // Approx due to bezier
        expect(circle.getHeight()).toBeCloseTo(4.0, 1);

        // Check bounds
        const bb = circle.getBoundingBox();
        expect(bb[3]).toBeCloseTo(2, 1); // maxX
        expect(bb[0]).toBeCloseTo(-2, 1); // minX
    });

    test('Rectangle dimensions', () => {
        const rect = new Rectangle({ width: 3, height: 5 });
        expect(rect.getWidth()).toBeCloseTo(3);
        expect(rect.getHeight()).toBeCloseTo(5);

        // Check that it is closed (start == end)
        const start = rect.getPoints()[0];
        const end = rect.getLastPoint();
        expect(vec3.distance(start, end)).toBeCloseTo(0);
    });

    test('Square properties', () => {
        const square = new Square({ sideLength: 3 });
        expect(square.getWidth()).toBeCloseTo(3);
        expect(square.getHeight()).toBeCloseTo(3);
    });

    test('Arc partial circle', () => {
        const arc = new Arc({ angle: TAU / 2, radius: 1 });
        // Should span from (1,0) to (-1,0) if rotated 0?
        // Wait, Arc implementation rotates startAngle.
        // Arc default starts at (R, 0).
        // Arc with angle PI goes to (-R, 0) via (0, R).

        const bb = arc.getBoundingBox();
        // Since it's a semi-circle from 0 to PI:
        // X ranges from -1 to 1.
        // Y ranges from 0 to 1.

        expect(bb[3]).toBeCloseTo(1, 1); // maxX
        expect(bb[0]).toBeCloseTo(-1, 1); // minX
        expect(bb[4]).toBeCloseTo(1, 1); // maxY
        expect(bb[1]).toBeCloseTo(0, 1); // minY
    });
});
