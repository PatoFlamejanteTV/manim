import { VMobject } from './VMobject';
import { vec3 } from 'gl-matrix';

describe('VMobject', () => {
    let vmob: VMobject;

    beforeEach(() => {
        vmob = new VMobject();
    });

    test('initialization defaults', () => {
        expect(vmob.strokeWidth).toBe(4.0);
        expect(vmob.fillOpacity).toBe(0.0);
    });

    test('adding lines', () => {
        const p0 = vec3.fromValues(0, 0, 0);
        const p1 = vec3.fromValues(1, 0, 0);

        vmob.startNewPath(p0);
        vmob.addLineTo(p1);

        // Expected: P0, Handle, P1. Total 3 points.
        expect(vmob.getNumPoints()).toBe(3);

        const points = vmob.getPoints();
        expect(points[0]).toEqual(p0);
        expect(points[2]).toEqual(p1);

        // Handle should be midpoint for a straight line added via addLineTo logic
        expect(points[1][0]).toBeCloseTo(0.5);
    });

    test('pointFromProportion', () => {
        const p0 = vec3.fromValues(0, 0, 0);
        const p1 = vec3.fromValues(2, 0, 0);

        vmob.startNewPath(p0);
        vmob.addLineTo(p1);

        const mid = vmob.pointFromProportion(0.5);
        expect(mid[0]).toBeCloseTo(1);

        const end = vmob.pointFromProportion(1.0);
        expect(end[0]).toBeCloseTo(2);
    });

    test('setStroke and setFill', () => {
        vmob.setStroke({ width: 10, opacity: 0.5 });
        expect(vmob.strokeWidth).toBe(10);
        expect(vmob.strokeOpacity).toBe(0.5);

        vmob.setFill({ color: '#FF0000', opacity: 1.0 });
        expect(vmob.fillColor).toBe('#FF0000');
        expect(vmob.fillOpacity).toBe(1.0);
    });
});
