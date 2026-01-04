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

        const MAX_RUNTIME = 300; // 5 minutes limit to prevent DoS
        if (!isFinite(runTime) || runTime <= 0 || runTime > MAX_RUNTIME) {
            console.warn(`Scene.play: runTime ${runTime} is invalid (must be 0 < t <= ${MAX_RUNTIME}). Skipping animation.`);
            return;
        }

        // Start
        for (const anim of animations) {
            anim.begin();
            // Ensure mobject is in scene
            this.add(anim.mobject);
        }

        // Simulate loop
        // In real app, this is requestAnimationFrame.
        // Here we simulate with steps.
        const fps = 60;
        const dt = 1 / fps;
        let t = 0;

        while (t < runTime) {
            t += dt;
            const alpha = Math.min(t / runTime, 1.0);

            for (const anim of animations) {
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
