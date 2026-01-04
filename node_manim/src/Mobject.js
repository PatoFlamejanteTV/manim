const THREE = require('three');

class Mobject {
    constructor() {
        this.points = [];
        this.submobjects = [];
        this.parents = [];
        this.color = new THREE.Color(1, 1, 1); // White
        this.opacity = 1.0;
        this.position = new THREE.Vector3(0, 0, 0); // Logic position, though points store actual data
    }

    add(child) {
        if (!child) return;
        if (this.submobjects.includes(child)) return;

        // Cycle detection
        if (this.hasAncestor(child)) {
            throw new Error("Cycle detected: cannot add ancestor as child");
        }

        this.submobjects.push(child);
        child.parents.push(this);
    }

    remove(child) {
        if (!child) return;
        const index = this.submobjects.indexOf(child);
        if (index > -1) {
            this.submobjects.splice(index, 1);
            const parentIndex = child.parents.indexOf(this);
            if (parentIndex > -1) {
                child.parents.splice(parentIndex, 1);
            }
        }
    }

    hasAncestor(target) {
        if (this === target) return true;
        for (const parent of this.parents) {
            if (parent.hasAncestor(target)) return true;
        }
        return false;
    }

    // Points management
    addPoint(x, y, z) {
        this.points.push(new THREE.Vector3(x, y, z));
    }

    setPoints(pointsArray) {
        this.points = pointsArray.map(p => new THREE.Vector3(p.x, p.y, p.z));
    }

    getPoints() {
        return this.points;
    }

    // Transformations
    shift(vector) {
        const v = new THREE.Vector3(vector.x, vector.y, vector.z);
        this.applyToPointsAndChildren((point) => point.add(v));
    }

    scale(factor) {
        this.applyToPointsAndChildren((point) => point.multiplyScalar(factor));
    }

    rotate(angle, axis) {
        const vAxis = new THREE.Vector3(axis.x, axis.y, axis.z).normalize();
        if (vAxis.length() === 0) return; // Handle zero axis gracefully
        this.applyToPointsAndChildren((point) => point.applyAxisAngle(vAxis, angle));
    }

    applyToPointsAndChildren(func, visited = new Set()) {
        if (visited.has(this)) return; // Simple cycle break for recursion, though graph should be acyclic
        visited.add(this);

        for (const point of this.points) {
            func(point);
        }
        for (const child of this.submobjects) {
            child.applyToPointsAndChildren(func, visited);
        }
    }

    // Attributes
    setColor(r, g, b) {
        this.color.setRGB(r, g, b);
        for (const child of this.submobjects) {
            child.setColor(r, g, b);
        }
    }

    setOpacity(opacity) {
        this.opacity = opacity;
        for (const child of this.submobjects) {
            child.setOpacity(opacity);
        }
    }
}

module.exports = Mobject;
