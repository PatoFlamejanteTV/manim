import { Group } from '../mobject/Group';
import { VGroup } from '../mobject/VGroup';
import { Mobject } from '../mobject/Mobject';
import { VMobject } from '../mobject/VMobject';

describe('Groups', () => {
    test('Group add/remove', () => {
        const g = new Group();
        const m1 = new Mobject();
        const m2 = new Mobject();

        g.add(m1, m2);
        expect(g.submobjects.length).toBe(2);
        expect(g.submobjects).toContain(m1);

        g.remove(m1);
        expect(g.submobjects.length).toBe(1);
        expect(g.submobjects).not.toContain(m1);
    });

    test('VGroup add/remove', () => {
        const g = new VGroup();
        const m1 = new VMobject();

        g.add(m1);
        expect(g.submobjects).toContain(m1);
    });
});
