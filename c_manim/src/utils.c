#include "../include/cmanim.h"
#include <math.h>

const Vector3 UP = {0.0f, 1.0f, 0.0f};
const Vector3 DOWN = {0.0f, -1.0f, 0.0f};
const Vector3 LEFT = {-1.0f, 0.0f, 0.0f};
const Vector3 RIGHT = {1.0f, 0.0f, 0.0f};
const Vector3 OUT = {0.0f, 0.0f, 1.0f};
const Vector3 IN = {0.0f, 0.0f, -1.0f};
const Vector3 ORIGIN = {0.0f, 0.0f, 0.0f};

const Color WHITE = {1.0f, 1.0f, 1.0f, 1.0f};
const Color RED = {1.0f, 0.0f, 0.0f, 1.0f};
const Color GREEN = {0.0f, 1.0f, 0.0f, 1.0f};
const Color BLUE = {0.0f, 0.0f, 1.0f, 1.0f};

Vector3 vec3_create(float x, float y, float z) {
    Vector3 v = {x, y, z};
    return v;
}

Vector3 vec3_add(Vector3 a, Vector3 b) {
    return (Vector3){a.x + b.x, a.y + b.y, a.z + b.z};
}

Vector3 vec3_sub(Vector3 a, Vector3 b) {
    return (Vector3){a.x - b.x, a.y - b.y, a.z - b.z};
}

Vector3 vec3_scale(Vector3 v, float s) {
    return (Vector3){v.x * s, v.y * s, v.z * s};
}

float vec3_dot(Vector3 a, Vector3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

float vec3_norm(Vector3 v) {
    return sqrtf(vec3_dot(v, v));
}

Vector3 vec3_normalize(Vector3 v) {
    float n = vec3_norm(v);
    if (n == 0) return (Vector3){0, 0, 0};
    return vec3_scale(v, 1.0f / n);
}

Color color_create(float r, float g, float b, float a) {
    return (Color){r, g, b, a};
}
