import { Mobject } from './Mobject';

export class Group extends Mobject {
    constructor(...mobjects: Mobject[]) {
        super();
        this.add(...mobjects);
    }
}
