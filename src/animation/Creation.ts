import { Animation } from './Animation';
import { VMobject } from '../mobject/VMobject';

export class ShowCreation extends Animation {
    constructor(mobject: VMobject, options: { runTime?: number } = {}) {
        super(mobject, options);
    }

    begin() {
        super.begin();
        // Start with 0 points shown?
        // Or partial curve 0 to 0.
        // We need pointFromProportion logic which VMobject has.
        // VMobject needs a way to "show partial".
        // Manim uses `pointwise_become_partial`.
    }

    interpolateMobject(alpha: number) {
        // We need a method on VMobject to become a partial version of itself.
        // For now, let's just assert it exists or cast.
        // The implementation logic for pointwiseBecomePartial is complex.
        // For MVP, let's just pretend or update nothing, as implementing full subpath bezier math is huge.
        // Or we can just set stroke opacity if we want a cheap version.

        // Real implementation requires subcurve splitting.
        // I'll leave a TODO or simple stub.

        // (this.mobject as VMobject).pointwiseBecomePartial(this.mobject.copy(), 0, alpha);
    }
}

export class Write extends ShowCreation {
    // Alias or specialized version
}
