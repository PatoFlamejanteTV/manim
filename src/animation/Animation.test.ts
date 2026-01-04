import { Scene } from '../scene/Scene';
import { Mobject } from '../mobject/Mobject';
import { Animation, FadeIn } from './Animation';

describe('Animation', () => {
    test('Scene.play runs animation', () => {
        const scene = new Scene();
        const mob = new Mobject({ opacity: 1.0 }); // Start with target opacity for FadeIn to capture

        // Mock animation
        const anim = new FadeIn(mob, { runTime: 1.0 });

        // Initial state - Animation hasn't started yet, so it is 1.0 (from constructor)
        // But scene.play will call anim.begin() which sets it to 0.
        // So we can check state *after* begin if we were calling it manually,
        // but play calls it.

        scene.play(anim);

        // Should be finished
        expect(mob.opacity).toBeCloseTo(1.0);
        expect(scene.time).toBeCloseTo(1.0, 1);
    });

    test('FadeIn interpolation', () => {
        const mob = new Mobject({ opacity: 1 }); // Target 1
        const anim = new FadeIn(mob, { runTime: 1.0 });

        anim.begin();
        expect(mob.opacity).toBe(0);

        anim.interpolate(0.5);
        expect(mob.opacity).toBe(0.5);

        anim.finish();
        expect(mob.opacity).toBe(1.0);
    });
});
