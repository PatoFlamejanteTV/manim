import { vec3, vec4 } from 'gl-matrix';

// Configuration placeholders (in a real port, these would come from a config module)
export const DEFAULT_PIXEL_WIDTH = 1920;
export const DEFAULT_PIXEL_HEIGHT = 1080;
export const ASPECT_RATIO = DEFAULT_PIXEL_WIDTH / DEFAULT_PIXEL_HEIGHT;
export const FRAME_HEIGHT = 8.0;
export const FRAME_WIDTH = FRAME_HEIGHT * ASPECT_RATIO;
export const FRAME_Y_RADIUS = FRAME_HEIGHT / 2;
export const FRAME_X_RADIUS = FRAME_WIDTH / 2;

export const SMALL_BUFF = 0.1;
export const MED_SMALL_BUFF = 0.25;
export const MED_LARGE_BUFF = 0.5;
export const LARGE_BUFF = 1;

export const DEFAULT_MOBJECT_TO_EDGE_BUFF = MED_LARGE_BUFF;
export const DEFAULT_MOBJECT_TO_MOBJECT_BUFF = MED_SMALL_BUFF;

export const ORIGIN = vec3.fromValues(0, 0, 0);
export const UP = vec3.fromValues(0, 1, 0);
export const DOWN = vec3.fromValues(0, -1, 0);
export const RIGHT = vec3.fromValues(1, 0, 0);
export const LEFT = vec3.fromValues(-1, 0, 0);
export const IN = vec3.fromValues(0, 0, -1);
export const OUT = vec3.fromValues(0, 0, 1);
export const X_AXIS = vec3.fromValues(1, 0, 0);
export const Y_AXIS = vec3.fromValues(0, 1, 0);
export const Z_AXIS = vec3.fromValues(0, 0, 1);

export const PI = Math.PI;
export const TAU = 2 * PI;
export const DEG = TAU / 360;
export const DEGREES = DEG;
export const RADIANS = 1;

// Colors
export const WHITE = "#FFFFFF";
export const BLACK = "#000000";
export const RED = "#FF0000";
export const GREEN = "#00FF00";
export const BLUE = "#0000FF";
export const YELLOW = "#FFFF00";

export const DEFAULT_MOBJECT_COLOR = WHITE;
