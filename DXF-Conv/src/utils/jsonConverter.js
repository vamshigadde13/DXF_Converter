/**
 * JSON Converter
 * Exports coordinate data in JSON format for integration with other systems
 */

/**
 * Converts normalized 2D points to JSON format
 * @param {Array} points - Array of {x, z} points in millimeters
 * @param {Object} metadata - Optional metadata to include
 * @returns {string} JSON file content
 */
export function convertToJSON(points, metadata = {}) {
    if (!points || points.length < 1) {
        throw new Error('At least 1 point is required for JSON');
    }

    const output = {
        format: 'DXF-Converter-Export',
        version: '1.0.0',
        metadata: {
            pointCount: points.length,
            units: 'millimeters',
            coordinateSystem: '2D (X, Z)',
            ...metadata,
        },
        points: points.map((point, index) => ({
            index: index,
            x: point.x,
            z: point.z,
        })),
    };

    return JSON.stringify(output, null, 2);
}

