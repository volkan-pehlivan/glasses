/**
 * Lens shape configurations
 * Used by both LensGeometry (full config with height + cornerRadii) and LensModel (width multipliers for bridge calc).
 */

export const SHAPE_CONFIGS = {
    classic: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.05, topRight: 0.05, bottomLeft: 0.45, bottomRight: 0.45 }
    },
    rectangle: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.25, topRight: 0.25, bottomLeft: 0.25, bottomRight: 0.25 }
    },
    circle: {
        topWidth: 1.0,
        bottomWidth: 1.0,
        height: 1.0,
        cornerRadii: { topLeft: 0.5, topRight: 0.5, bottomLeft: 0.5, bottomRight: 0.5 }
    },
    oval: {
        topWidth: 1.4,
        bottomWidth: 1.4,
        height: 0.9,
        cornerRadii: { topLeft: 0.5, topRight: 0.5, bottomLeft: 0.5, bottomRight: 0.5 }
    },
    aviator: {
        topWidth: 1.3,
        bottomWidth: 1.5,
        height: 0.9,
        cornerRadii: { topLeft: 0.25, topRight: 0.25, bottomLeft: 0.15, bottomRight: 0.15 }
    },
    wayfarer: {
        topWidth: 1.5,
        bottomWidth: 1.3,
        height: 0.9,
        cornerRadii: { topLeft: 0.15, topRight: 0.15, bottomLeft: 0.25, bottomRight: 0.25 }
    }
}
