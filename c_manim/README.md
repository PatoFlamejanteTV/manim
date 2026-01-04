# C-Manim

A C rewrite of the core functionality of ManimGL.

## Structure

- `include/`: Header files defining the public API.
- `src/`: Source code implementation.
- `tests/`: Test suite.

## Building and Testing

To build and run the tests:

```sh
make test
```

## Implemented Features

- **Mobject**: Core data structure for mathematical objects.
- **Hierarchy**: Support for parent/child relationships (`add`, `remove`).
- **Points**: Management of points and colors.
- **Transformations**: `shift`, `scale`, `rotate` (including recursive application to children).
- **Attributes**: Color and opacity management.
- **Vector Math**: Basic 3D vector operations.

## Usage Example

```c
#include "cmanim.h"

int main() {
    Mobject* parent = mobject_create();
    Mobject* child = mobject_create();

    mobject_add(parent, child);

    // Add points
    mobject_add_point(child, (Vector3){1.0f, 0.0f, 0.0f});

    // Transform
    mobject_shift(parent, (Vector3){0.0f, 1.0f, 0.0f});

    // Cleanup
    mobject_free(parent);
    mobject_free(child);
    return 0;
}
```
