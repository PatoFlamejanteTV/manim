#include "../include/cmanim.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#define MAX_RECURSION_DEPTH 100

// Helpers (Return 1 on success, 0 on failure)
static int ensure_data_capacity(Mobject* mob, size_t min_cap) {
    if (mob->data_cap >= min_cap) return 1;
    size_t new_cap = mob->data_cap == 0 ? 8 : mob->data_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;

    void* temp = realloc(mob->data, new_cap * sizeof(PointData));
    if (!temp) {
        return 0;
    }
    mob->data = temp;
    mob->data_cap = new_cap;
    return 1;
}

static int ensure_sub_capacity(Mobject* mob, size_t min_cap) {
    if (mob->sub_cap >= min_cap) return 1;
    size_t new_cap = mob->sub_cap == 0 ? 4 : mob->sub_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;

    void* temp = realloc(mob->submobjects, new_cap * sizeof(Mobject*));
    if (!temp) {
        return 0;
    }
    mob->submobjects = temp;
    mob->sub_cap = new_cap;
    return 1;
}

static int ensure_parents_capacity(Mobject* mob, size_t min_cap) {
    if (mob->parents_cap >= min_cap) return 1;
    size_t new_cap = mob->parents_cap == 0 ? 2 : mob->parents_cap * 2;
    if (new_cap < min_cap) new_cap = min_cap;

    void* temp = realloc(mob->parents, new_cap * sizeof(Mobject*));
    if (!temp) {
        return 0;
    }
    mob->parents = temp;
    mob->parents_cap = new_cap;
    return 1;
}

Mobject* mobject_create() {
    Mobject* mob = calloc(1, sizeof(Mobject));
    if (!mob) return NULL;

    mob->color = WHITE;
    mob->opacity = 1.0f;

    return mob;
}

// Detaches mob from all parents and children to prevent use-after-free
static void mobject_detach(Mobject* mob) {
    if (!mob) return;

    // Remove mob from all its parents' submobjects lists
    for (size_t i = 0; i < mob->parents_len; ++i) {
        Mobject* p = mob->parents[i];
        if (p) {
            // Find mob in p->submobjects
            for (size_t j = 0; j < p->sub_len; ++j) {
                if (p->submobjects[j] == mob) {
                    memmove(&p->submobjects[j], &p->submobjects[j+1], (p->sub_len - j - 1) * sizeof(Mobject*));
                    p->sub_len--;
                    break;
                }
            }
        }
    }
    // Clear parents list
    mob->parents_len = 0;

    // Remove mob from all its children's parents lists
    for (size_t i = 0; i < mob->sub_len; ++i) {
        Mobject* child = mob->submobjects[i];
        if (child) {
            // Find mob in child->parents
            for (size_t j = 0; j < child->parents_len; ++j) {
                if (child->parents[j] == mob) {
                    memmove(&child->parents[j], &child->parents[j+1], (child->parents_len - j - 1) * sizeof(Mobject*));
                    child->parents_len--;
                    break;
                }
            }
        }
    }
    // Clear submobjects list
    mob->sub_len = 0;
}


void mobject_free(Mobject* mob) {
    if (!mob) return;

    mobject_detach(mob);

    if (mob->data) free(mob->data);
    if (mob->submobjects) free(mob->submobjects);
    if (mob->parents) free(mob->parents);

    free(mob);
}

int mobject_add(Mobject* parent, Mobject* child) {
    if (!parent || !child) return 0;

    bool in_parent = false;
    for (size_t i = 0; i < parent->sub_len; ++i) {
        if (parent->submobjects[i] == child) {
            in_parent = true;
            break;
        }
    }

    bool in_child = false;
    for (size_t i = 0; i < child->parents_len; ++i) {
        if (child->parents[i] == parent) {
            in_child = true;
            break;
        }
    }

    if (in_parent && in_child) return 1;

    if (!in_parent) {
        if (!ensure_sub_capacity(parent, parent->sub_len + 1)) return 0;
        parent->submobjects[parent->sub_len++] = child;
    }
    if (!in_child) {
        if (!ensure_parents_capacity(child, child->parents_len + 1)) return 0;
        child->parents[child->parents_len++] = parent;
    }
    return 1;
}

void mobject_remove(Mobject* parent, Mobject* child) {
    if (!parent || !child) return;

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
    if (!parent) return;
    while (parent->sub_len > 0) {
        mobject_remove(parent, parent->submobjects[0]);
    }
}

int mobject_resize_points(Mobject* mob, size_t new_len) {
    if (!mob) return 0;
    if (!ensure_data_capacity(mob, new_len)) return 0;
int mobject_set_points(Mobject* mob, Vector3* points, size_t count) {
    if (!mob) return 0;
    if (count > 0 && !points) return 0;

    if (!mobject_resize_points(mob, count)) return 0;
        memset(&mob->data[mob->data_len], 0, (new_len - mob->data_len) * sizeof(PointData));

        // Use default color
        for (size_t i = mob->data_len; i < new_len; ++i) {
            mob->data[i].color = mob->color;
            mob->data[i].color.a = mob->opacity;
        }
    }
    mob->data_len = new_len;
    return 1;
}

int mobject_set_points(Mobject* mob, Vector3* points, size_t count) {
    if (!mob || !points) return 0;
    if (!mobject_resize_points(mob, count)) return 0;
    for (size_t i = 0; i < count; ++i) {
        mob->data[i].point = points[i];
    }
    return 1;
static void mobject_shift_recursive(Mobject* mob, Vector3 vector, int depth) {
    if (!mob) return;
    if (depth > MAX_RECURSION_DEPTH) return;
int mobject_add_point(Mobject* mob, Vector3 point) {
    if (!mob) return 0;
    if (!ensure_data_capacity(mob, mob->data_len + 1)) return 0;

    mob->data[mob->data_len].point = point;
    mob->data[mob->data_len].color = mob->color;
    mob->data[mob->data_len].color.a = mob->opacity;
    mob->data_len++;
    return 1;
}

// Recursive helpers with depth check

static void mobject_shift_recursive(Mobject* mob, Vector3 vector, int depth) {
    if (depth > MAX_RECURSION_DEPTH) return;

    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].point = vec3_add(mob->data[i].point, vector);
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_shift_recursive(mob->submobjects[i], vector, depth + 1);
    }
}

void mobject_shift(Mobject* mob, Vector3 vector) {
    if (!mob) return;
    mobject_shift_recursive(mob, vector, 0);
}

static void mobject_scale_recursive(Mobject* mob, float factor, int depth) {
    if (!mob) return;
    if (depth > MAX_RECURSION_DEPTH) return;

    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].point = vec3_scale(mob->data[i].point, factor);
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_scale_recursive(mob->submobjects[i], factor, depth + 1);
    }
}

void mobject_scale(Mobject* mob, float factor) {
    if (!mob) return;
    mobject_scale_recursive(mob, factor, 0);
}

static void mobject_rotate_recursive(Mobject* mob, float angle, Vector3 axis, int depth) {
    if (depth > MAX_RECURSION_DEPTH) return;

    // Axis angle rotation about origin
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
        static void mobject_set_color_recursive(Mobject* mob, Color color, int depth) {
            if (!mob) return;
            if (depth > MAX_RECURSION_DEPTH) return;

            // Keep opacity authoritative; apply RGB while preserving alpha
            mob->color = (Color){color.r, color.g, color.b, mob->opacity};

            for (size_t i = 0; i < mob->data_len; ++i) {
                float a = mob->data[i].color.a;
                mob->data[i].color = (Color){color.r, color.g, color.b, a};
            }
        mobject_rotate_recursive(mob->submobjects[i], angle, axis, depth + 1);
    }
}

void mobject_rotate(Mobject* mob, float angle, Vector3 axis) {
    if (!mob) return;
    mobject_rotate_recursive(mob, angle, axis, 0);
}

static void mobject_set_color_recursive(Mobject* mob, Color color, int depth) {
    if (depth > MAX_RECURSION_DEPTH) return;

    mob->color = color;
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].color = color;
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_set_color_recursive(mob->submobjects[i], color, depth + 1);
    }
}

void mobject_set_color(Mobject* mob, Color color) {
    if (!mob) return;
    mobject_set_color_recursive(mob, color, 0);
}

static void mobject_set_opacity_recursive(Mobject* mob, float opacity, int depth) {
    if (depth > MAX_RECURSION_DEPTH) return;

    mob->opacity = opacity;
    for (size_t i = 0; i < mob->data_len; ++i) {
        mob->data[i].color.a = opacity;
    }
    for (size_t i = 0; i < mob->sub_len; ++i) {
        mobject_set_opacity_recursive(mob->submobjects[i], opacity, depth + 1);
    }
}

void mobject_set_opacity(Mobject* mob, float opacity) {
    if (!mob) return;
    if (opacity < 0.0f) opacity = 0.0f;
    if (opacity > 1.0f) opacity = 1.0f;
    mobject_set_opacity_recursive(mob, opacity, 0);
}

void print_mobject_info(Mobject* mob) {
    if (!mob) {
        printf("Mobject is NULL\n");
        return;
    }
    // Removed raw address printing as per security compliance
    printf("Mobject Info:\n");
    printf("  Points: %zu\n", mob->data_len);
    for (size_t i = 0; i < mob->data_len; ++i) {
        Vector3 p = mob->data[i].point;
        printf("    [%zu]: (%f, %f, %f)\n", i, p.x, p.y, p.z);
    }
    printf("  Submobjects: %zu\n", mob->sub_len);
}
