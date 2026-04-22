import { NativeModules, requireNativeComponent, NativeEventEmitter, Platform } from 'react-native';

const { ARFloorScanner } = NativeModules;

/**
 * Native AR Floor Scanner Module for React Native
 * 
 * Provides ARCore-based floor plan scanning functionality:
 * - Plane detection
 * - Tap-to-place points
 * - Point collection and export
 * - JSON export matching Unity format
 */
class ARFloorScannerModule {
    constructor() {
        if (!ARFloorScanner) {
            console.warn('ARFloorScanner native module is not available');
            return;
        }

        this.eventEmitter = new NativeEventEmitter(ARFloorScanner);
        this.listeners = [];
    }

    /**
     * Start AR session
     * @returns {Promise<string>}
     */
    async startSession() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        if (Platform.OS !== 'android') {
            throw new Error('AR Floor Scanner is only available on Android');
        }

        try {
            return await ARFloorScanner.startSession();
        } catch (error) {
            console.error('Failed to start AR session:', error);
            throw error;
        }
    }

    /**
     * Stop AR session
     * @returns {Promise<string>}
     */
    async stopSession() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            return await ARFloorScanner.stopSession();
        } catch (error) {
            console.error('Failed to stop AR session:', error);
            throw error;
        }
    }

    /**
     * Clear all collected points
     * @returns {Promise<string>}
     */
    async clearPoints() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            return await ARFloorScanner.clearPoints();
        } catch (error) {
            console.error('Failed to clear points:', error);
            throw error;
        }
    }

    /**
     * Finish scan and export points as JSON
     * @returns {Promise<string>} JSON string array of points
     */
    async finishScan() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            const jsonString = await ARFloorScanner.finishScan();
            return jsonString;
        } catch (error) {
            console.error('Failed to finish scan:', error);
            throw error;
        }
    }

    /**
     * Get current point count
     * @returns {Promise<number>}
     */
    async getPointCount() {
        if (!ARFloorScanner) {
            return 0;
        }

        try {
            return await ARFloorScanner.getPointCount();
        } catch (error) {
            console.error('Failed to get point count:', error);
            return 0;
        }
    }

    /**
     * Check if ARCore is supported on this device
     * @returns {Promise<{supported: boolean, installed: boolean, message: string}>}
     */
    async isARSupported() {
        if (!ARFloorScanner || Platform.OS !== 'android') {
            return {
                supported: false,
                installed: false,
                message: 'AR Floor Scanner is only available on Android'
            };
        }

        try {
            const result = await ARFloorScanner.isARSupported();
            // Handle both old boolean format and new object format
            if (typeof result === 'boolean') {
                return {
                    supported: result,
                    installed: result,
                    message: result ? 'ARCore is available' : 'ARCore is not available'
                };
            }
            return result;
        } catch (error) {
            console.error('Failed to check AR support:', error);
            return {
                supported: false,
                installed: false,
                message: `Error checking AR support: ${error.message || error}`
            };
        }
    }

    /**
     * Add listener for point added events
     * @param {Function} callback - Callback function receiving point data
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        if (!this.eventEmitter) {
            return () => {};
        }

        const subscription = this.eventEmitter.addListener('onPointAdded', (data) => {
            callback({
                x: data.x,
                y: data.y,
                z: data.z,
                count: data.count || 0,
            });
        });

        this.listeners.push(subscription);

        return () => {
            subscription.remove();
            this.listeners = this.listeners.filter((sub) => sub !== subscription);
        };
    }

    /**
     * Add listener for error events
     * @param {Function} callback - Callback function receiving error message
     * @returns {Function} Unsubscribe function
     */
    addErrorListener(callback) {
        if (!this.eventEmitter) {
            return () => {};
        }

        const subscription = this.eventEmitter.addListener('onError', (data) => {
            callback(data.message || 'Unknown error');
        });

        this.listeners.push(subscription);

        return () => {
            subscription.remove();
            this.listeners = this.listeners.filter((sub) => sub !== subscription);
        };
    }

    /**
     * Remove all listeners
     */
    removeAllListeners() {
        this.listeners.forEach((subscription) => subscription.remove());
        this.listeners = [];
    }

    /**
     * Undo last point
     * @returns {Promise<string>}
     */
    async undoLastPoint() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            return await ARFloorScanner.undoLastPoint();
        } catch (error) {
            console.error('Failed to undo last point:', error);
            throw error;
        }
    }

    /**
     * Add listener for points updated events (includes distances, area, segments)
     * @param {Function} callback - Callback function receiving update data
     * @returns {Function} Unsubscribe function
     */
    addPointsUpdatedListener(callback) {
        if (!this.eventEmitter) {
            return () => {};
        }

        const subscription = this.eventEmitter.addListener('onPointsUpdated', (data) => {
            callback(data);
        });

        this.listeners.push(subscription);

        return () => {
            subscription.remove();
            this.listeners = this.listeners.filter((sub) => sub !== subscription);
        };
    }

    /**
     * Add listener for measurement update events (real-time distance)
     * @param {Function} callback - Callback function receiving distance data
     * @returns {Function} Unsubscribe function
     */
    addMeasurementUpdateListener(callback) {
        if (!this.eventEmitter) {
            return () => {};
        }

        const subscription = this.eventEmitter.addListener('onMeasurementUpdate', (data) => {
            callback(data);
        });

        this.listeners.push(subscription);

        return () => {
            subscription.remove();
            this.listeners = this.listeners.filter((sub) => sub !== subscription);
        };
    }

    /**
     * Add point from center screen indicator (placement indicator position)
     * Places a point where the center indicator is positioned over a detected plane
     * @returns {Promise<string>}
     */
    async addPointFromCenterIndicator() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            return await ARFloorScanner.addPointFromCenterIndicator();
        } catch (error) {
            console.error('Failed to add point from center indicator:', error);
            throw error;
        }
    }

    /**
     * Add point from preview (uses center indicator if available)
     * @returns {Promise<string>}
     */
    async addPointFromPreview() {
        if (!ARFloorScanner) {
            throw new Error('ARFloorScanner is not available');
        }

        try {
            return await ARFloorScanner.addPointFromPreview();
        } catch (error) {
            console.error('Failed to add point from preview:', error);
            throw error;
        }
    }

    /**
     * Add listener for surface detection events
     * @param {Function} callback - Callback function receiving surface detection data
     * @returns {Function} Unsubscribe function
     */
    addSurfaceDetectionListener(callback) {
        if (!this.eventEmitter) {
            return () => {};
        }

        const subscription = this.eventEmitter.addListener('onSurfaceDetection', (data) => {
            callback(data);
        });

        this.listeners.push(subscription);

        return () => {
            subscription.remove();
            this.listeners = this.listeners.filter((sub) => sub !== subscription);
        };
    }
}

// Export singleton instance
const ARFloorScannerModuleInstance = new ARFloorScannerModule();

// Export native view component
export const ARFloorScannerView = requireNativeComponent('ARFloorScannerView', null, {
    nativeOnly: {},
});

// Export module instance
export default ARFloorScannerModuleInstance;

