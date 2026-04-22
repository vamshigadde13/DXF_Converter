/**
 * Background DXF Converter
 * Converts text/JSON coordinate data to DXF format
 */

import { convertToSVG } from './svgConverter';
import { convertToJSON } from './jsonConverter';

// Constants for validation
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB max input size
const MAX_POINTS = 100000; // Maximum number of points
const MAX_COORDINATE_VALUE = 1e9; // Maximum coordinate value in meters (1 billion meters)
const MIN_COORDINATE_VALUE = -1e9; // Minimum coordinate value in meters

/**
 * Validates input data before parsing
 * @param {string} rawData - Raw input string
 * @throws {Error} If validation fails
 */
function validateInput(rawData) {
    if (typeof rawData !== 'string') {
        throw new Error('Input must be a string');
    }

    // Check size limit
    if (rawData.length > MAX_INPUT_SIZE) {
        throw new Error(`Input size exceeds maximum allowed size of ${MAX_INPUT_SIZE / 1024 / 1024}MB`);
    }

    // Check basic structural integrity
    const trimmed = rawData.trim();
    if (trimmed.length === 0) {
        throw new Error('Input cannot be empty');
    }

    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
        throw new Error('Input must be a valid JSON array or object');
    }
}

/**
 * Validates coordinate values are within reasonable bounds
 * @param {number} value - Coordinate value
 * @param {string} coordName - Name of coordinate (for error messages)
 * @returns {number} Validated coordinate value
 * @throws {Error} If coordinate is out of bounds
 */
function validateCoordinate(value, coordName) {
    if (isNaN(value) || !isFinite(value)) {
        throw new Error(`${coordName} coordinate must be a valid number`);
    }

    if (value > MAX_COORDINATE_VALUE || value < MIN_COORDINATE_VALUE) {
        throw new Error(`${coordName} coordinate value ${value} is out of allowed range (${MIN_COORDINATE_VALUE} to ${MAX_COORDINATE_VALUE})`);
    }

    return value;
}

/**
 * Converts raw text data (JSON format) to DXF file content
 * @param {string} rawData - JSON string with coordinate data
 * @param {boolean} closePolyline - Whether to close the polyline
 * @returns {string} DXF file content
 */
export function convertToDXF(rawData, closePolyline = true) {
    try {
        // Validate input before parsing
        validateInput(rawData);

        // Parse JSON data
        let data;
        try {
            data = JSON.parse(rawData);
        } catch (parseError) {
            throw new Error(`Invalid JSON format: ${parseError.message}`);
        }

        if (!Array.isArray(data)) {
            throw new Error('Data must be a JSON array');
        }

        if (data.length < 2) {
            throw new Error('Data must contain at least 2 points');
        }

        if (data.length > MAX_POINTS) {
            throw new Error(`Data contains too many points (${data.length}). Maximum allowed is ${MAX_POINTS}`);
        }

        // Validate and extract coordinates
        const points = data.map((point, index) => {
            if (typeof point !== 'object' || point === null) {
                throw new Error(`Point ${index} must be an object`);
            }

            if (typeof point.x === 'undefined' || typeof point.z === 'undefined') {
                throw new Error(`Point ${index} is missing x or z coordinate`);
            }

            const x = validateCoordinate(parseFloat(point.x), `Point ${index} x`);
            const z = validateCoordinate(parseFloat(point.z), `Point ${index} z`);

            return { x, z };
        });

        // Convert meters to millimeters
        const pointsInMM = points.map(point => ({
            x: Math.round(point.x * 1000), // meters to mm, rounded
            z: Math.round(point.z * 1000),
        }));

        // Normalize: shift all points so first point = (0, 0)
        const firstPoint = pointsInMM[0];
        const normalizedPoints = pointsInMM.map(point => ({
            x: point.x - firstPoint.x,
            z: point.z - firstPoint.z,
        }));

        // Sort points clockwise around centroid to form proper polygon
        const sorted = sortPointsClockwise(normalizedPoints);

        // Generate DXF content
        return generateDXFContent(sorted, closePolyline);
    } catch (error) {
        throw new Error(`Conversion failed: ${error.message}`);
    }
}

/**
 * Sorts points clockwise around their centroid to form a proper polygon
 * Fixes zig-zag lines caused by unordered AR data points
 * @param {Array} points - Array of {x, z} points
 * @returns {Array} Sorted points array
 */
function sortPointsClockwise(points) {
    if (points.length < 3) {
        // Don't sort if less than 3 points (line or single point)
        return points;
    }

    // Step 1: Compute centroid
    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p.z, 0) / points.length;

    // Step 2: Compute angle for each point and sort
    return points
        .map(p => ({
            ...p,
            angle: Math.atan2(p.z - cy, p.x - cx)
        }))
        .sort((a, b) => a.angle - b.angle)
        .map(({ angle, ...p }) => p); // Remove angle property
}

/**
 * Generates ArtCAM-compatible DXF file content (R12 format)
 * Uses minimal DXF structure: ENTITIES only, no handles, POLYLINE instead of LWPOLYLINE
 * @param {Array} points - Array of {x, z} points in millimeters
 * @param {boolean} closePolyline - Whether to close the polyline
 * @returns {string} DXF file content
 */
function generateDXFContent(points, closePolyline) {
    const dxf = [];

    // ENTITIES Section (R12 format - no HEADER, no TABLES, no handles)
    dxf.push('0');
    dxf.push('SECTION');
    dxf.push('2');
    dxf.push('ENTITIES');

    // POLYLINE HEADER (ArtCAM prefers POLYLINE over LWPOLYLINE)
    dxf.push('0');
    dxf.push('POLYLINE');
    dxf.push('8');
    dxf.push('0');        // Layer
    dxf.push('66');
    dxf.push('1');        // Vertices follow flag
    dxf.push('70');
    dxf.push(closePolyline ? '1' : '0'); // Closed polyline = 1, open = 0

    // Vertices
    points.forEach(point => {
        // Ensure coordinates are within safe bounds for DXF format
        const x = Math.max(-1e9, Math.min(1e9, point.x));
        const z = Math.max(-1e9, Math.min(1e9, point.z));

        dxf.push('0');
        dxf.push('VERTEX');
        dxf.push('8');
        dxf.push('0'); // Layer
        dxf.push('10');
        dxf.push(x.toString());
        dxf.push('20');
        dxf.push(z.toString());
    });

    // SEQEND required for POLYLINE (ArtCAM requires this)
    dxf.push('0');
    dxf.push('SEQEND');

    // End section
    dxf.push('0');
    dxf.push('ENDSEC');
    dxf.push('0');
    dxf.push('EOF');

    return dxf.join('\r\n');
}

/**
 * Processes and normalizes coordinate data (shared by all converters)
 * @param {string} rawData - JSON string with coordinate data
 * @returns {Array} Normalized points array
 */
export function processCoordinateData(rawData) {
    // Validate input before parsing
    validateInput(rawData);

    // Parse JSON data
    let data;
    try {
        data = JSON.parse(rawData);
    } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
    }

    if (!Array.isArray(data)) {
        throw new Error('Data must be a JSON array');
    }

    if (data.length < 2) {
        throw new Error('Data must contain at least 2 points');
    }

    if (data.length > MAX_POINTS) {
        throw new Error(`Data contains too many points (${data.length}). Maximum allowed is ${MAX_POINTS}`);
    }

    // Validate and extract coordinates
    const points = data.map((point, index) => {
        if (typeof point !== 'object' || point === null) {
            throw new Error(`Point ${index} must be an object`);
        }

        if (typeof point.x === 'undefined' || typeof point.z === 'undefined') {
            throw new Error(`Point ${index} is missing x or z coordinate`);
        }

        const x = validateCoordinate(parseFloat(point.x), `Point ${index} x`);
        const z = validateCoordinate(parseFloat(point.z), `Point ${index} z`);

        return { x, z };
    });

    // Convert meters to millimeters
    const pointsInMM = points.map(point => ({
        x: Math.round(point.x * 1000), // meters to mm, rounded
        z: Math.round(point.z * 1000),
    }));

    // Normalize: shift all points so first point = (0, 0)
    const firstPoint = pointsInMM[0];
    const normalizedPoints = pointsInMM.map(point => ({
        x: point.x - firstPoint.x,
        z: point.z - firstPoint.z,
    }));

    return normalizedPoints;
}

/**
 * Background conversion function that runs asynchronously
 * @param {string} rawData - JSON string with coordinate data
 * @param {string} format - Output format: 'dxf', 'svg', or 'json'
 * @param {Function} onComplete - Callback when conversion is complete
 * @param {Function} onError - Callback when conversion fails
 */
export function convertInBackground(rawData, format = 'dxf', onComplete, onError) {
    // Use setTimeout to run conversion in background (non-blocking)
    setTimeout(() => {
        try {
            const normalizedPoints = processCoordinateData(rawData);

            // Sort points clockwise around centroid to form proper polygon
            const sortedPoints = sortPointsClockwise(normalizedPoints);

            let content;
            let fileExtension;
            let mimeType;

            switch (format.toLowerCase()) {
                case 'svg':
                    content = convertToSVG(sortedPoints, true);
                    fileExtension = 'svg';
                    mimeType = 'image/svg+xml';
                    break;
                case 'json':
                    content = convertToJSON(sortedPoints, {
                        timestamp: new Date().toISOString(),
                    });
                    fileExtension = 'json';
                    mimeType = 'application/json';
                    break;
                case 'dxf':
                default:
                    content = generateDXFContent(sortedPoints, true);
                    fileExtension = 'dxf';
                    mimeType = 'application/acad';
                    break;
            }

            onComplete(content, fileExtension, mimeType);
        } catch (error) {
            onError(error);
        }
    }, 0);
}

/**
 * Legacy function for backward compatibility
 */
export function convertToDXFInBackground(rawData, onComplete, onError) {
    convertInBackground(rawData, 'dxf', (content) => {
        onComplete(content);
    }, onError);
}

