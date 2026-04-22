# Native Kotlin AR Floor Scanner - Integration Guide

This guide explains how to integrate the native Kotlin AR Floor Scanner into your React Native app, replacing the Unity AR integration.

## ✅ What's Been Implemented

### Native Kotlin Module (Android)
- ✅ ARCore session management
- ✅ Plane detection for horizontal surfaces
- ✅ Tap-to-place point collection
- ✅ Point management and storage
- ✅ JSON export matching Unity format
- ✅ React Native bridge (Native Module + ViewManager)

### React Native Integration
- ✅ JavaScript wrapper module (`src/modules/ARFloorScanner.js`)
- ✅ Native view component
- ✅ Event listeners for point additions
- ✅ Promise-based API

## 📁 File Structure

```
DXF-Conv/
├── android/app/src/main/java/com/dxfconv/app/ar/
│   ├── models/
│   │   └── ARPoint.kt              # Point data class
│   ├── ARPointCollector.kt         # Point collection singleton
│   ├── ARSessionManager.kt         # ARCore session lifecycle
│   ├── ARFloorScannerView.kt       # Custom AR view
│   ├── ARPlaneVisualizer.kt        # Plane visualization (2D)
│   ├── ARFloorScannerViewManager.kt # RN ViewManager
│   ├── ARFloorScannerModule.kt     # RN Native Module
│   └── ARFloorScannerPackage.kt    # Package registration
│
└── src/modules/
    └── ARFloorScanner.js           # JS wrapper module
```

## 🚀 Quick Start

### 1. Update ScanScreen.js

Replace the mock/Unity AR code with the native Kotlin AR module:

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import ARFloorScanner, { ARFloorScannerView } from '../modules/ARFloorScanner';

export default function ScanScreen({ onScanComplete, onBack }) {
    const [isScanning, setIsScanning] = useState(false);
    const [pointCount, setPointCount] = useState(0);
    const [isARSupported, setIsARSupported] = useState(false);

    useEffect(() => {
        // Check AR support on mount
        checkARSupport();
        
        // Cleanup on unmount
        return () => {
            ARFloorScanner.removeAllListeners();
            ARFloorScanner.stopSession().catch(console.error);
        };
    }, []);

    const checkARSupport = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Not Available', 'AR Floor Scanner is only available on Android');
            return;
        }

        try {
            const supported = await ARFloorScanner.isARSupported();
            setIsARSupported(supported);
            
            if (!supported) {
                Alert.alert(
                    'AR Not Supported',
                    'ARCore is not available on this device. Please install ARCore from Google Play Store.'
                );
            }
        } catch (error) {
            console.error('AR support check failed:', error);
        }
    };

    const handleStartScan = async () => {
        if (!isARSupported) {
            Alert.alert('Error', 'AR is not supported on this device');
            return;
        }

        try {
            // Clear previous points
            await ARFloorScanner.clearPoints();
            setPointCount(0);
            
            // Start AR session
            await ARFloorScanner.startSession();
            setIsScanning(true);
            
            Alert.alert(
                'AR Scanning Started',
                'Point camera at the floor and tap to place points. Tap "Finish Scan" when done.'
            );
        } catch (error) {
            Alert.alert('Error', `Failed to start AR session: ${error.message}`);
        }
    };

    const handleFinishScan = async () => {
        if (!isScanning) {
            Alert.alert('Error', 'No active scan session');
            return;
        }

        try {
            const jsonString = await ARFloorScanner.finishScan();
            const points = JSON.parse(jsonString);
            
            if (points.length < 2) {
                Alert.alert(
                    'Insufficient Points',
                    'Please collect at least 2 points before finishing the scan.'
                );
                return;
            }

            setIsScanning(false);
            await ARFloorScanner.stopSession();
            
            // Pass data to HomeScreen
            if (onScanComplete) {
                onScanComplete(jsonString);
            }
        } catch (error) {
            Alert.alert('Error', `Failed to finish scan: ${error.message}`);
        }
    };

    const handlePointAdded = (event) => {
        const { count } = event.nativeEvent;
        setPointCount(count);
    };

    if (!isARSupported) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    ARCore is not available on this device
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {isScanning ? (
                <>
                    <ARFloorScannerView
                        style={styles.arView}
                        onPointAdded={handlePointAdded}
                    />
                    <View style={styles.overlay}>
                        <Text style={styles.overlayText}>
                            Points: {pointCount}
                        </Text>
                        <TouchableOpacity
                            style={styles.finishButton}
                            onPress={handleFinishScan}
                        >
                            <Text style={styles.finishButtonText}>
                                Finish Scan
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleStartScan}
                    >
                        <Text style={styles.startButtonText}>
                            Start AR Scan
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    arView: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    overlayText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 10,
    },
    finishButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    controls: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 12,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        margin: 20,
    },
});
```

### 2. Build and Test

```bash
cd DXF-Conv
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

### 3. Test on Device

1. Install ARCore from Google Play Store (if not pre-installed)
2. Grant camera permissions when prompted
3. Run the app and navigate to Scan Screen
4. Point camera at a horizontal surface (floor/table)
5. Wait for plane detection
6. Tap on detected planes to place points
7. Tap "Finish Scan" to export JSON

## 📋 API Reference

### ARFloorScanner Module

#### Methods

- `startSession(): Promise<string>` - Start ARCore session
- `stopSession(): Promise<string>` - Stop ARCore session
- `clearPoints(): Promise<string>` - Clear all collected points
- `finishScan(): Promise<string>` - Export points as JSON string
- `getPointCount(): Promise<number>` - Get current point count
- `isARSupported(): Promise<boolean>` - Check ARCore availability

#### Events

- `addListener(callback)` - Listen for point added events
- `addErrorListener(callback)` - Listen for error events
- `removeAllListeners()` - Remove all event listeners

### ARFloorScannerView Component

#### Props

- `style` - Standard React Native style prop
- `onPointAdded` - Callback when a point is added
- `onError` - Callback for errors

#### Events

The view emits the following events:

- `onPointAdded` - Fired when a point is added via tap
  ```javascript
  {
    nativeEvent: {
      x: number,
      y: number,
      z: number,
      count: number
    }
  }
  ```

## 🔧 Configuration

### Android Permissions

Already configured in `AndroidManifest.xml`:
- `android.permission.CAMERA`
- `android.hardware.camera.ar` (feature)

### ARCore Dependency

Already added in `build.gradle`:
```gradle
implementation 'com.google.ar:core:1.46.0'
```

## ⚠️ Known Limitations

1. **Camera Rendering**: Full camera feed rendering requires OpenGL ES integration (future enhancement)

2. **3D Visualization**: Current plane visualization is simplified 2D projection

3. **Device Support**: Requires ARCore-compatible device

## 🐛 Troubleshooting

### ARCore Not Available

- Ensure device is ARCore-compatible: https://developers.google.com/ar/discover/supported-devices
- Install ARCore from Google Play Store
- Check that camera permissions are granted

### Build Errors

- Clean build: `cd android && ./gradlew clean`
- Sync Gradle in Android Studio
- Ensure ARCore dependency is correctly added

### Points Not Adding

- Ensure plane is detected (look for visual indicators)
- Tap directly on detected horizontal planes
- Check device is moving (ARCore needs motion for tracking)

## 🎯 Next Steps

1. Test the integration in ScanScreen.js
2. Customize UI/UX as needed
3. Add error handling and user feedback
4. Consider adding point editing/removal features
5. Enhance visualization with full 3D rendering

