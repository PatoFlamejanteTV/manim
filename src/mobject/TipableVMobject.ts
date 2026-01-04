import { VMobject } from './VMobject';
import { ArrowTip } from './Geometry'; // Will implement in Geometry.ts
import { vec3 } from 'gl-matrix';
import { angleOfVector, normalize, rotateVector } from '../utils/math';
import { PI } from '../constants';

export class TipableVMobject extends VMobject {
    tip: ArrowTip | null = null;
    startTip: ArrowTip | null = null;

    addTip(atStart: boolean = false, options: any = {}): this {
        const tip = new ArrowTip(options);
        this.positionTip(tip, atStart);
        this.resetEndpointsBasedOnTip(tip, atStart);
        this.assignTipAttr(tip, atStart);
        // tip.setColor(this.getStrokeColor()); // TODO: Implement getStrokeColor
        this.add(tip);
        return this;
    }

    positionTip(tip: ArrowTip, atStart: boolean = false): void {
        const anchor = atStart ? this.getStart() : this.getEnd();
        const handle = atStart ? this.getFirstHandle() : this.getLastHandle();

        // Direction vector
        const direction = vec3.create();
        vec3.subtract(direction, handle, anchor);

        const angle = angleOfVector(direction) - PI - tip.getAngle();
        tip.rotate(angle);

        const shiftVal = vec3.create();
        vec3.subtract(shiftVal, anchor, tip.getTipPoint());
        tip.shift(shiftVal);
    }

    resetEndpointsBasedOnTip(tip: ArrowTip, atStart: boolean): void {
        // Complex logic to shorten the line to the tip base
        // Simplified for now: just shorten the line
        // In full Manim, it uses put_start_and_end_on
    }

    assignTipAttr(tip: ArrowTip, atStart: boolean): void {
        if (atStart) {
            this.startTip = tip;
        } else {
            this.tip = tip;
        }
    }

    getStart(): vec3 {
        return this.getPoints()[0];
    }

    getEnd(): vec3 {
        const points = this.getPoints();
        return points[points.length - 1]; // Last anchor
    }

    getFirstHandle(): vec3 {
        // Points: P0, H0, P1...
        // Wait, quadratic is P0, H0, P1.
        // H0 is index 1.
        const points = this.getPoints();
        return points.length > 1 ? points[1] : points[0];
    }

    getLastHandle(): vec3 {
        const points = this.getPoints();
        return points.length > 2 ? points[points.length - 2] : points[points.length - 1];
    }
}
