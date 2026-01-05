import { VMobject } from './VMobject';

export class VGroup extends VMobject {
    constructor(...vmobjects: VMobject[]) {
        super();
        this.add(...vmobjects);
    }
}
