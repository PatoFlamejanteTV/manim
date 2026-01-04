import { Scene } from './Scene';
import { Mobject } from '../mobject/Mobject';

describe('Scene', () => {
    test('adding and removing mobjects', () => {
        const scene = new Scene();
        const mob = new Mobject();

        scene.add(mob);
        expect(scene.getMobjects()).toContain(mob);

        scene.remove(mob);
        expect(scene.getMobjects()).not.toContain(mob);
    });

    test('update loop', () => {
        const scene = new Scene();
        const mob = new Mobject();
        let updated = false;

        mob.addUpdater((m, dt) => {
            updated = true;
        });

        scene.add(mob);
        scene.update(0.1);

        expect(updated).toBe(true);
        expect(scene.time).toBeCloseTo(0.1);
    });
});
