/**
 * SVG Converter
 * Converts coordinate data to SVG format for visual validation
 */

/**
 * Converts normalized 2D points to SVG format
 * @param {Array} points - Array of {x, z} points in millimeters
 * @param {boolean} closePolyline - Whether to close the polyline
 * @returns {string} SVG file content
 */
export function convertToSVG(points, closePolyline = true) {
    if (!points || points.length < 2) {
        throw new Error('At least 2 points are required for SVG');
    }

    // Calculate bounding box for viewBox
    const xCoords = points.map(p => p.x);
    const zCoords = points.map(p => p.z);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minZ = Math.min(...zCoords);
    const maxZ = Math.max(...zCoords);

    // Add padding (10% of size)
    const width = maxX - minX || 100;
    const height = maxZ - minZ || 100;
    const padding = Math.max(width, height) * 0.1;

    const viewBoxX = minX - padding;
    const viewBoxY = minZ - padding;
    const viewBoxWidth = width + (padding * 2);
    const viewBoxHeight = height + (padding * 2);

    // Build path data
    let pathData = '';
    points.forEach((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        pathData += `${command} ${point.x} ${point.z} `;
    });

    if (closePolyline && points.length > 2) {
        pathData += 'Z';
    }

    // Generate SVG content
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}"
     width="800" 
     height="600"
     style="background-color: #ffffff;">
  <g transform="translate(0,${viewBoxHeight}) scale(1,-1)">
    <path d="${pathData.trim()}" 
          fill="none" 
          stroke="#000000" 
          stroke-width="1" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
  </g>
</svg>`;

    return svg;
}

