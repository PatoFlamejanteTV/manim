import { Animation } from './Animation';
import { VMobject } from '../mobject/VMobject';

export class ShowCreation extends Animation {
    constructor(mobject: VMobject, options: { runTime?: number } = {}) {
        super(mobject, options);
    }

    begin() {
        super.begin();
        (this.mobject as VMobject).setStroke({ opacity: 0 });
        (this.mobject as VMobject).setFill({ opacity: 0 });
    }

    interpolateMobject(alpha: number) {
        (this.mobject as VMobject).setStroke({ opacity: alpha });
    }
}

export class Write extends ShowCreation {
    // Alias or specialized version
}
