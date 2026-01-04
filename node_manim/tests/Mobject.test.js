const Mobject = require('../src/Mobject');
const THREE = require('three');

describe('Mobject', () => {
    test('initialization', () => {
        const mob = new Mobject();
        expect(mob.points.length).toBe(0);
        expect(mob.submobjects.length).toBe(0);
        expect(mob.parents.length).toBe(0);
        expect(mob.opacity).toBe(1.0);
    });

    test('add point', () => {
        const mob = new Mobject();
        mob.addPoint(1, 2, 3);
        expect(mob.points.length).toBe(1);
        expect(mob.points[0].x).toBe(1);
        expect(mob.points[0].y).toBe(2);
        expect(mob.points[0].z).toBe(3);
    });

    test('hierarchy add/remove', () => {
        const parent = new Mobject();
        const child = new Mobject();

        parent.add(child);
        expect(parent.submobjects).toContain(child);
        expect(child.parents).toContain(parent);

        parent.remove(child);
        expect(parent.submobjects).not.toContain(child);
        expect(child.parents).not.toContain(parent);
    });

    test('transformations: shift', () => {
        const mob = new Mobject();
        mob.addPoint(1, 0, 0);
        mob.shift({x: 1, y: 1, z: 1});
        expect(mob.points[0].x).toBe(2);
        expect(mob.points[0].y).toBe(1);
        expect(mob.points[0].z).toBe(1);
    });

    test('transformations: scale', () => {
        const mob = new Mobject();
        mob.addPoint(2, 0, 0);
        mob.scale(2);
        expect(mob.points[0].x).toBe(4);
    });

    test('transformations: rotate', () => {
        const mob = new Mobject();
        mob.addPoint(1, 0, 0);
        // Rotate 90 deg around Z
        mob.rotate(Math.PI / 2, {x: 0, y: 0, z: 1});
        expect(mob.points[0].x).toBeCloseTo(0);
        expect(mob.points[0].y).toBeCloseTo(1);
    });

    test('recursive transformations', () => {
        const parent = new Mobject();
        const child = new Mobject();
        parent.add(child);
        child.addPoint(1, 0, 0);

        parent.shift({x: 1, y: 0, z: 0});
        expect(child.points[0].x).toBe(2);
    });

    test('cycle detection', () => {
        const a = new Mobject();
        const b = new Mobject();
        const c = new Mobject();

        a.add(b);
        b.add(c);

        expect(() => {
            c.add(a);
        }).toThrow("Cycle detected");
    });

    test('attributes propagation', () => {
        const parent = new Mobject();
        const child = new Mobject();
        parent.add(child);

        parent.setOpacity(0.5);
        expect(child.opacity).toBe(0.5);

        parent.setColor(1, 0, 0);
        expect(child.color.r).toBe(1);
    });
});
