#include "../include/cmanim.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

// Helpers
static void ensure_data_capacity(Mobject* mob, size_t min_cap) {
    if (mob->data_cap >= min_cap) return;
    size_t new_cap = mob->data_cap == 0 ? 8 : mob->data_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;
    PointData *tmp = realloc(mob->data, new_cap * sizeof(PointData));
    if (!tmp) {
        fprintf(stderr, "Out of memory in ensure_data_capacity\n");
        exit(EXIT_FAILURE);
    }
    mob->data = tmp;
    mob->data_cap = new_cap;
}

static void ensure_sub_capacity(Mobject* mob, size_t min_cap) {
    if (mob->sub_cap >= min_cap) return;
    size_t new_cap = mob->sub_cap == 0 ? 4 : mob->sub_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;
    mob->submobjects = realloc(mob->submobjects, new_cap * sizeof(Mobject*));
    mob->sub_cap = new_cap;
}

static void ensure_parents_capacity(Mobject* mob, size_t min_cap) {
    if (mob->parents_cap >= min_cap) return;
    size_t new_cap = mob->parents_cap == 0 ? 2 : mob->parents_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;
    mob->parents = realloc(mob->parents, new_cap * sizeof(Mobject*));
    mob->parents_cap = new_cap;
}

Mobject* mobject_create() {
    Mobject* mob = calloc(1, sizeof(Mobject));
    if (!mob) return NULL;

    mob->color = WHITE;
    mob->opacity = 1.0f;

    return mob;
}

void mobject_free(Mobject* mob) {
    if (!mob) return;

    // We do not free submobjects automatically because they might be shared or managed elsewhere
    // But in a strict tree, we might want to.
    // For now, let's assume the user handles it or we need a specific "destroy_tree" function.
    // However, to prevent leaks in tests, we should probably just free data arrays.

    if (mob->data) free(mob->data);
    if (mob->submobjects) free(mob->submobjects);
    if (mob->parents) free(mob->parents);

    free(mob);
}

void mobject_add(Mobject* parent, Mobject* child) {
    if (!parent || !child) return;
    // Check if already added
    for (size_t i = 0; i < parent->sub_len; ++i) {
        if (parent->submobjects[i] == child) return;
    }

    ensure_sub_capacity(parent, parent->sub_len + 1);
    parent->submobjects[parent->sub_len++] = child;

    ensure_parents_capacity(child, child->parents_len + 1);
    child->parents[child->parents_len++] = parent;
}

void mobject_remove(Mobject* parent, Mobject* child) {
    // Remove from parent->submobjects
    for (size_t i = 0; i < parent->sub_len; ++i) {
        if (parent->submobjects[i] == child) {
            // Shift rest
            memmove(&parent->submobjects[i], &parent->submobjects[i+1], (parent->sub_len - i - 1) * sizeof(Mobject*));
            parent->sub_len--;
            break;
        }
    }

    // Remove from child->parents
    for (size_t i = 0; i < child->parents_len; ++i) {
        if (child->parents[i] == parent) {
            memmove(&child->parents[i], &child->parents[i+1], (child->parents_len - i - 1) * sizeof(Mobject*));
            child->parents_len--;
            break;
        }
    }
}

void mobject_clear(Mobject* parent) {
    while (parent->sub_len > 0) {
        mobject_remove(parent, parent->submobjects[0]);
    }
}

void mobject_resize_points(Mobject* mob, size_t new_len) {
    ensure_data_capacity(mob, new_len);
    if (new_len > mob->data_len) {
        // Init new points
        // In python manim, it defaults to previous point, but here we'll just zero or keep trash for now unless we carefully copy
        // Let's zero them to be safe
        memset(&mob->data[mob->data_len], 0, (new_len - mob->data_len) * sizeof(PointData));

        // Use default color
        for (size_t i = mob->data_len; i < new_len; ++i) {
            mob->data[i].color = mob->color;
            mob->data[i].color.a = mob->opacity;
        }
    }
    mob->data_len = new_len;
}

void mobject_set_points(Mobject* mob, Vector3* points, size_t count) {
    mobject_resize_points(mob, count);
    for (size_t i = 0; i < count; ++i) {
        mob->data[i].point = points[i];
    }
}

void mobject_add_point(Mobject* mob, Vector3 point) {
    ensure_data_capacity(mob, mob->data_len + 1);
    mob->data[mob->data_len].point = point;
    mob->data[mob->data_len].color = mob->color;
    mob->data[mob->data_len].color.a = mob->opacity;
    mob->data_len++;
}


void mobject_shift(Mobject* mob, Vector3 vector) {
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].point = vec3_add(mob->data[i].point, vector);
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_shift(mob->submobjects[i], vector);
    }
}

void mobject_scale(Mobject* mob, float factor) {
    // Scaling about origin for now
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].point = vec3_scale(mob->data[i].point, factor);
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_scale(mob->submobjects[i], factor);
    }
}

void mobject_rotate(Mobject* mob, float angle, Vector3 axis) {
    // Axis angle rotation about origin
    // v' = v cos(theta) + (k x v) sin(theta) + k(k.v)(1 - cos(theta))
    Vector3 k = vec3_normalize(axis);
    float cos_t = cosf(angle);
    float sin_t = sinf(angle);

    for (size_t i = 0; i < mob->data_len; ++i) {
        Vector3 v = mob->data[i].point;

        // k x v
        Vector3 cross = {
            k.y * v.z - k.z * v.y,
            k.z * v.x - k.x * v.z,
            k.x * v.y - k.y * v.x
        };

        float dot = vec3_dot(k, v);

        Vector3 term1 = vec3_scale(v, cos_t);
        Vector3 term2 = vec3_scale(cross, sin_t);
        Vector3 term3 = vec3_scale(k, dot * (1 - cos_t));

        mob->data[i].point = vec3_add(term1, vec3_add(term2, term3));
    }

    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_rotate(mob->submobjects[i], angle, axis);
    }
}

void mobject_set_color(Mobject* mob, Color color) {
    mob->color = color;
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].color = color;
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_set_color(mob->submobjects[i], color);
    }
}

void mobject_set_opacity(Mobject* mob, float opacity) {
    mob->opacity = opacity;
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].color.a = opacity;
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_set_opacity(mob->submobjects[i], opacity);
    }
}

void print_mobject_info(Mobject* mob) {
    printf("Mobject at %p\n", (void*)mob);
    printf("  Points: %zu\n", mob->data_len);
    for (size_t i = 0; i < mob->data_len; ++i) {
        Vector3 p = mob->data[i].point;
        printf("    [%zu]: (%f, %f, %f)\n", i, p.x, p.y, p.z);
    }
    printf("  Submobjects: %zu\n", mob->sub_len);
}
