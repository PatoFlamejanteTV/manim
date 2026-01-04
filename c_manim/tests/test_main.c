#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <math.h>
#include "../include/cmanim.h"

#define ASSERT_VEC3_EQ(v1, v2) \
    do { \
        if (fabsf(v1.x - v2.x) > 1e-4 || fabsf(v1.y - v2.y) > 1e-4 || fabsf(v1.z - v2.z) > 1e-4) { \
            fprintf(stderr, "%s:%d: Assertion failed: (%f, %f, %f) != (%f, %f, %f)\n", \
                    __FILE__, __LINE__, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z); \
            exit(1); \
        } \
    } while(0)

#define ASSERT_EQ(a, b) \
    do { \
        if ((a) != (b)) { \
            fprintf(stderr, "%s:%d: Assertion failed: %ld != %ld\n", __FILE__, __LINE__, (long)(a), (long)(b)); \
            exit(1); \
        } \
    } while(0)

#define ASSERT_FLOAT_EQ(a, b) \
    do { \
        if (fabsf((a) - (b)) > 1e-4) { \
            fprintf(stderr, "%s:%d: Assertion failed: %f != %f\n", __FILE__, __LINE__, (float)(a), (float)(b)); \
            exit(1); \
        } \
    } while(0)


void test_vector_math() {
    printf("Testing Vector Math...\n");
    Vector3 v1 = {1, 2, 3};
    Vector3 v2 = {4, 5, 6};

    Vector3 sum = vec3_add(v1, v2);
    ASSERT_VEC3_EQ(sum, ((Vector3){5, 7, 9}));

    Vector3 sub = vec3_sub(v2, v1);
    ASSERT_VEC3_EQ(sub, ((Vector3){3, 3, 3}));

    float dot = vec3_dot(v1, v2); // 4 + 10 + 18 = 32
    ASSERT_FLOAT_EQ(dot, 32.0f);

    printf("Vector Math Passed.\n");
}

void test_mobject_lifecycle() {
    printf("Testing Mobject Lifecycle...\n");
    Mobject* mob = mobject_create();
    ASSERT_EQ(mob->data_len, 0);
    ASSERT_EQ(mob->sub_len, 0);

    mobject_free(mob);
    printf("Mobject Lifecycle Passed.\n");
}

void test_mobject_points() {
    printf("Testing Mobject Points...\n");
    Mobject* mob = mobject_create();

    Vector3 p1 = {1, 0, 0};
    mobject_add_point(mob, p1);

    ASSERT_EQ(mob->data_len, 1);
    ASSERT_VEC3_EQ(mob->data[0].point, p1);

    Vector3 pts[] = {{0, 1, 0}, {0, 0, 1}};
    mobject_set_points(mob, pts, 2);

    ASSERT_EQ(mob->data_len, 2);
    ASSERT_VEC3_EQ(mob->data[0].point, pts[0]);
    ASSERT_VEC3_EQ(mob->data[1].point, pts[1]);

    mobject_free(mob);
    printf("Mobject Points Passed.\n");
}

void test_mobject_hierarchy() {
    printf("Testing Mobject Hierarchy...\n");
    Mobject* parent = mobject_create();
    Mobject* child1 = mobject_create();
    Mobject* child2 = mobject_create();

    mobject_add(parent, child1);
    ASSERT_EQ(parent->sub_len, 1);
    ASSERT_EQ(child1->parents_len, 1);
    ASSERT_EQ(child1->parents[0], parent);

    mobject_add(parent, child2);
    ASSERT_EQ(parent->sub_len, 2);

    mobject_remove(parent, child1);
    ASSERT_EQ(parent->sub_len, 1);
    ASSERT_EQ(parent->submobjects[0], child2);
    ASSERT_EQ(child1->parents_len, 0);

    mobject_free(parent);
    mobject_free(child1);
    mobject_free(child2);
    printf("Mobject Hierarchy Passed.\n");
}

void test_mobject_transform() {
    printf("Testing Mobject Transform...\n");
    Mobject* mob = mobject_create();
    mobject_add_point(mob, (Vector3){1, 0, 0});

    mobject_shift(mob, (Vector3){1, 1, 1});
    ASSERT_VEC3_EQ(mob->data[0].point, ((Vector3){2, 1, 1}));

    mobject_scale(mob, 2.0f);
    ASSERT_VEC3_EQ(mob->data[0].point, ((Vector3){4, 2, 2}));

    // Rotate 90 degrees around Z axis (should affect X and Y)
    // (4, 2, 2) -> (-2, 4, 2) roughly
    mobject_rotate(mob, 3.14159265f / 2.0f, (Vector3){0, 0, 1});

    // Allow some error due to PI approximation and float math
    Vector3 res = mob->data[0].point;
    Vector3 expected = {-2.0f, 4.0f, 2.0f};

    ASSERT_VEC3_EQ(res, expected);

    mobject_free(mob);
    printf("Mobject Transform Passed.\n");
}

void test_hierarchy_transform() {
    printf("Testing Hierarchy Transform...\n");
    Mobject* parent = mobject_create();
    Mobject* child = mobject_create();

    mobject_add(parent, child);
    mobject_add_point(child, (Vector3){1, 0, 0});

    // Shift parent, child should move
    mobject_shift(parent, (Vector3){1, 0, 0});
    ASSERT_VEC3_EQ(child->data[0].point, ((Vector3){2, 0, 0}));

    // Scale parent, child should scale
    mobject_scale(parent, 2.0f); // 2 * 2 = 4
    ASSERT_VEC3_EQ(child->data[0].point, ((Vector3){4, 0, 0}));

    mobject_free(parent);
    mobject_free(child);
    printf("Hierarchy Transform Passed.\n");
}

void test_color_opacity() {
    printf("Testing Color and Opacity...\n");
    Mobject* mob = mobject_create();
    mobject_add_point(mob, (Vector3){0,0,0});

    mobject_set_color(mob, RED);
    ASSERT_FLOAT_EQ(mob->color.r, 1.0f);
    ASSERT_FLOAT_EQ(mob->data[0].color.r, 1.0f);

    mobject_set_opacity(mob, 0.5f);
    ASSERT_FLOAT_EQ(mob->opacity, 0.5f);
    ASSERT_FLOAT_EQ(mob->data[0].color.a, 0.5f);

    // Hierarchy check
    Mobject* child = mobject_create();
    mobject_add(mob, child);
    mobject_add_point(child, (Vector3){1,1,1});

    mobject_set_color(mob, GREEN);
    ASSERT_FLOAT_EQ(child->color.g, 1.0f);
    ASSERT_FLOAT_EQ(child->data[0].color.g, 1.0f);

    mobject_free(mob);
    mobject_free(child);
    printf("Color and Opacity Passed.\n");
}

int main() {
    test_vector_math();
    test_mobject_lifecycle();
    test_mobject_points();
    test_mobject_hierarchy();
    test_mobject_transform();
    test_hierarchy_transform();
    test_color_opacity();

    printf("\nAll tests passed successfully!\n");
    return 0;
}
