import { Mobject } from '../mobject/Mobject';
import { interpolate } from '../utils/math';
import { Scene } from '../scene/Scene';

export class Animation {
    mobject: Mobject;
    runTime: number;
    rateFunc: (t: number) => number;

    constructor(mobject: Mobject, options: {
        runTime?: number,
        rateFunc?: (t: number) => number
    } = {}) {
        this.mobject = mobject;
        this.runTime = options.runTime !== undefined ? options.runTime : 1.0;
        this.rateFunc = options.rateFunc || (t => t); // Default linear
    }

    begin() {
        // Setup initial state
    }

    finish() {
        this.interpolate(1.0);
    }

    interpolateMobject(alpha: number) {
        // To be implemented by subclasses
    }

    interpolate(alpha: number) {
        alpha = Math.max(0, Math.min(1, alpha));
        this.interpolateMobject(this.rateFunc(alpha));
    }
}

export class FadeIn extends Animation {
    initialOpacity: number = 0;
    targetOpacity: number = 1;

    constructor(mobject: Mobject, options: { runTime?: number } = {}) {
        super(mobject, options);
        this.targetOpacity = mobject.opacity;
    }

    begin() {
        this.mobject.opacity = 0;
        this.mobject.setColor(this.mobject.color, 0);
    }

    interpolateMobject(alpha: number) {
        const opacity = interpolate(0, this.targetOpacity, alpha);
        this.mobject.opacity = opacity;
        // In full implementation, we'd update array data
        this.mobject.setColor(this.mobject.color, opacity);
    }
}
