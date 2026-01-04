import { Mobject } from '../mobject/Mobject';

// Interface for Animations to avoid circular dependency
export interface AnimationLike {
    mobject: Mobject;
    runTime: number;
    begin(): void;
    finish(): void;
    interpolate(alpha: number): void;
}

// Basic Scene class to manage time and mobjects
export class Scene {
    mobjects: Mobject[] = [];
    time: number = 0;

    constructor() {
        this.setup();
    }

    setup() {
        // To be overridden by subclasses
    }

    add(...mobjects: Mobject[]): this {
        for (const mob of mobjects) {
            if (!this.mobjects.includes(mob)) {
                this.mobjects.push(mob);
            }
        }
        return this;
    }

    remove(...mobjects: Mobject[]): this {
        for (const mob of mobjects) {
            const index = this.mobjects.indexOf(mob);
            if (index > -1) {
                this.mobjects.splice(index, 1);
            }
        }
        return this;
    }

    // Simulation Loop
    update(dt: number) {
        this.time += dt;
        for (const mob of this.mobjects) {
            mob.update(dt);
        }
    }

    wait(duration: number) {
        this.update(duration);
    }

    play(...animations: AnimationLike[]) {
        if (animations.length === 0) return;

        // Find max duration
        const runTime = Math.max(...animations.map(a => a.runTime));

        if (!isFinite(runTime) || runTime <= 0) {
            console.warn("Scene.play: runTime is invalid (0, negative, or infinite). Skipping animation.");
            return;
        }

        // Start
        for (const anim of animations) {
            anim.begin();
            // Ensure mobject is in scene
            this.add(anim.mobject);
        }

        // Simulate loop
        const fps = 60;
        const baseDt = 1 / fps;
        let t = 0;

        while (t < runTime) {
            const dt = Math.min(baseDt, runTime - t);
            t += dt;

            for (const anim of animations) {
                const animRunTime = anim.runTime;
                const alpha = (!isFinite(animRunTime) || animRunTime <= 0)
                    ? 1.0
                    : Math.min(t / animRunTime, 1.0);
                anim.interpolate(alpha);
            }

            this.update(dt);
        }

        // Finish
        for (const anim of animations) {
            anim.finish();
        }
    }

    getMobjects(): Mobject[] {
        return this.mobjects;
    }
}
