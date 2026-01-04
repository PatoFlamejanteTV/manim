#ifndef CMANIM_H
#define CMANIM_H

#include <stddef.h>
#include <stdbool.h>

// --- Data Structures ---

typedef struct {
    float x, y, z;
} Vector3;

typedef struct {
    float r, g, b, a;
} Color;

typedef struct {
    Vector3 point;
    Color color;
} PointData;

typedef struct Mobject Mobject;

struct Mobject {
    // Data (Points and Colors)
    PointData* data;
    size_t data_len;
    size_t data_cap;

    // Hierarchy
    Mobject** submobjects;
    size_t sub_len;
    size_t sub_cap;

    Mobject** parents;
    size_t parents_len;
    size_t parents_cap;

    // Uniforms (simplified)
    bool is_fixed_in_frame;
    float shading[3]; // reflectiveness, gloss, shadow
    float clip_plane[4];

    // Properties
    float opacity;
    Color color; // Default color
    bool depth_test;
};

// --- Constants ---
extern const Vector3 UP;
extern const Vector3 DOWN;
extern const Vector3 LEFT;
extern const Vector3 RIGHT;
extern const Vector3 OUT;
extern const Vector3 IN;
extern const Vector3 ORIGIN;

extern const Color WHITE;
extern const Color RED;
extern const Color GREEN;
extern const Color BLUE;


// --- Function Prototypes ---

// Utils
Vector3 vec3_create(float x, float y, float z);
Vector3 vec3_add(Vector3 a, Vector3 b);
Vector3 vec3_sub(Vector3 a, Vector3 b);
Vector3 vec3_scale(Vector3 v, float s);
float vec3_dot(Vector3 a, Vector3 b);
float vec3_norm(Vector3 v);
Vector3 vec3_normalize(Vector3 v);

Color color_create(float r, float g, float b, float a);

// Mobject Lifecycle
Mobject* mobject_create();
void mobject_free(Mobject* mob);

// Mobject Hierarchy
// Returns 1 on success, 0 on failure (e.g. allocation error or invalid input)
int mobject_add(Mobject* parent, Mobject* child);
void mobject_remove(Mobject* parent, Mobject* child);
void mobject_clear(Mobject* parent);

// Mobject Data/Points
// Returns 1 on success, 0 on failure
int mobject_set_points(Mobject* mob, Vector3* points, size_t count);
int mobject_add_point(Mobject* mob, Vector3 point);
int mobject_resize_points(Mobject* mob, size_t new_len);

// Mobject Transformations
void mobject_shift(Mobject* mob, Vector3 vector);
void mobject_scale(Mobject* mob, float factor);
void mobject_rotate(Mobject* mob, float angle, Vector3 axis);
void mobject_set_color(Mobject* mob, Color color);
void mobject_set_opacity(Mobject* mob, float opacity);

// Testing helper
void print_mobject_info(Mobject* mob);

#endif // CMANIM_H
