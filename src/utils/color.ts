import { vec3, vec4 } from 'gl-matrix';

export type Color = string; // Hex string for now

export function hexToRgb(hex: string): vec3 {
    // Validate input
    if (!/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex)) {
        console.warn("Invalid hex color string format. Returning black.");
        return vec3.fromValues(0, 0, 0);
    }

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return vec3.fromValues(r / 255.0, g / 255.0, b / 255.0);
}

export function rgbToHex(rgb: vec3): string {
    const r = Math.round(rgb[0] * 255);
    const g = Math.round(rgb[1] * 255);
    const b = Math.round(rgb[2] * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

export function colorGradient(colors: Color[], length: number): Color[] {
    // Validate inputs
    if (!Number.isFinite(length) || length <= 0) {
        return [];
    }
    // Validate inputs
    if (!Number.isFinite(length) || length <= 0) {
        return [];
    }
    length = Math.floor(length);
    if (length > 10000) {
        // Arbitrary limit to prevent resource exhaustion
        console.warn(`colorGradient: length ${length} exceeds maximum allowed size (10000). Truncating.`);
        length = 10000;
    }

    if (colors.length === 0) {
        return Array(length).fill("#000000"); // Return black if no colors provided
    }

    // Simplified linear interpolation for now
    if (length === 0) return [];
    if (length === 1) return [colors[0]];
    // TODO: Implement proper gradient logic
    return Array(length).fill(colors[0]);
}
