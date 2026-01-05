import { Mobject } from '../mobject/Mobject';
import { Color } from '../utils/color';
import { vec3 } from 'gl-matrix';

describe('Mobject', () => {
    let mob: Mobject;

    beforeEach(() => {
        mob = new Mobject();
    });

    test('initialization', () => {
        expect(mob.color).toBeDefined();
        expect(mob.opacity).toBe(1.0);
        expect(mob.submobjects).toEqual([]);
    });

    test('adding and removing submobjects', () => {
        const sub1 = new Mobject();
        const sub2 = new Mobject();

        mob.add(sub1, sub2);
        expect(mob.submobjects).toContain(sub1);
        expect(mob.submobjects).toContain(sub2);
        expect(sub1.parents).toContain(mob);

        mob.remove(sub1);
        expect(mob.submobjects).not.toContain(sub1);
        expect(mob.submobjects).toContain(sub2);
    });

    test('setting points', () => {
        const p1 = vec3.fromValues(0, 0, 0);
        const p2 = vec3.fromValues(1, 1, 0);
        mob.setPoints([p1, p2]);

        expect(mob.getNumPoints()).toBe(2);
        const points = mob.getPoints();
        expect(points[0]).toEqual(p1);
        expect(points[1]).toEqual(p2);
    });

    test('transforms: shift', () => {
        const p1 = vec3.fromValues(0, 0, 0);
        mob.setPoints([p1]);

        mob.shift(vec3.fromValues(1, 2, 3));
        const points = mob.getPoints();

        expect(points[0][0]).toBeCloseTo(1);
        expect(points[0][1]).toBeCloseTo(2);
        expect(points[0][2]).toBeCloseTo(3);
    });

    test('transforms: scale', () => {
        mob.setPoints([vec3.fromValues(1, 0, 0)]);
        mob.scale(2, vec3.fromValues(0, 0, 0)); // Scale about origin

        const points = mob.getPoints();
        expect(points[0][0]).toBeCloseTo(2);
        expect(points[0][1]).toBeCloseTo(0);
        expect(points[0][2]).toBeCloseTo(0);
    });

    test('bounding box calculation', () => {
        mob.setPoints([
            vec3.fromValues(-1, -1, 0),
            vec3.fromValues(1, 1, 0)
        ]);

        const bb = mob.getBoundingBox();
        expect(bb[0]).toBeCloseTo(-1); // minX
        expect(bb[1]).toBeCloseTo(-1); // minY
        expect(bb[3]).toBeCloseTo(1);  // maxX
        expect(bb[4]).toBeCloseTo(1);  // maxY

        expect(mob.getWidth()).toBeCloseTo(2);
        expect(mob.getHeight()).toBeCloseTo(2);

        const center = mob.getCenter();
        expect(center[0]).toBeCloseTo(0);
        expect(center[1]).toBeCloseTo(0);
        expect(center[2]).toBeCloseTo(0);
    });

    test('submobject propagation', () => {
        const sub = new Mobject();
        sub.setPoints([vec3.fromValues(0, 0, 0)]);
        mob.add(sub);

        mob.shift(vec3.fromValues(1, 0, 0));

        const subPoints = sub.getPoints();
        expect(subPoints[0][0]).toBeCloseTo(1);
    });
});
