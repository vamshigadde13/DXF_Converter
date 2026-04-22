# Product Requirements Document (PRD)
## AR Floor Scanning with Kotlin Implementation

**Version:** 1.0  
**Date:** 2024  
**Project:** DXF Converter - AR Floor Plan Scanner  
**Platform:** Android (Kotlin Native Module)

---

## 📋 Executive Summary

This PRD documents the current state of the DXF Converter application and outlines the requirements for implementing native AR floor scanning functionality using Kotlin, replacing the current Unity AR (C#) implementation.

---

## 🎯 Current Application State

### 1. Application Overview

**DXF Converter** is a React Native/Expo mobile application that:
- Converts coordinate data (JSON format) to multiple output formats (DXF, SVG, JSON)
- Supports AR-based floor plan scanning
- Provides file import/export capabilities
- Targets Android and iOS platforms

### 2. Current Architecture

#### 2.1 Frontend (React Native/Expo)
- **Framework:** Expo SDK ~54.0.25, React Native 0.81.5
- **Main Screens:**
  - `HomeScreen.js` - Main conversion interface with format selection (DXF/SVG/JSON)
  - `ScanScreen.js` - AR scanning interface (currently supports Unity AR JSON import)
  - `DownloadScreen.js` - File download and sharing interface

#### 2.2 Core Functionality

**Coordinate Data Processing:**
- Accepts JSON array format: `[{ "x": 1.245, "y": 0.002, "z": -0.532 }, ...]`
- Validates input (min 2 points, max 100,000 points)
- Normalizes coordinates (meters to millimeters, origin shift)
- Sorts points clockwise around centroid for proper polygon formation

**Conversion Formats:**
- **DXF (R12 format):** ArtCAM-compatible POLYLINE format
- **SVG:** Vector graphics for visual validation
- **JSON:** Standardized coordinate output

**File Operations:**
- Import JSON files via document picker
- Auto-detect Unity AR exported files from Downloads folder
- Export converted files with sharing capabilities

#### 2.3 Current AR Implementation (Unity)

**Unity AR Floor Plan Scanner:**
- **Technology:** Unity 2021.3+ with AR Foundation
- **Platform:** Separate Unity app (C#)
- **Features:**
  - AR plane detection (ground/floor) using ARCore (Android) / ARKit (iOS)
  - Tap-to-place point collection on detected planes
  - Visual feedback with point markers
  - JSON export to Downloads folder (`/storage/emulated/0/Download/ar_points.json`)

**Workflow:**
1. User opens Unity AR app
2. Scans floor using AR plane detection
3. Taps to place points on detected planes
4. Exports JSON file to Downloads
5. Returns to React Native app
6. Imports JSON file via ScanScreen
7. Converts to DXF/SVG/JSON

**Limitations:**
- Requires separate Unity app installation
- Two-app workflow (poor UX)
- No direct integration with React Native app
- Unity dependency adds complexity

### 3. Android Project Structure

**Current Setup:**
- **Package:** `com.dxfconv.app`
- **Kotlin Support:** Enabled (`org.jetbrains.kotlin.android`)
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** Latest
- **Main Activity:** `MainActivity.kt` (React Native bridge)
- **Permissions:** READ/WRITE_EXTERNAL_STORAGE, INTERNET

---

## 🚀 Requirements: Native Kotlin AR Implementation

### 1. Objective

Replace Unity AR implementation with a native Kotlin AR module that:
- Integrates directly into the React Native app
- Uses ARCore for Android AR functionality
- Provides seamless UX within the existing app
- Maintains compatibility with existing JSON data format

### 2. Functional Requirements

#### 2.1 AR Scanning Features

**FR-1: AR Session Management**
- Initialize ARCore session on app launch
- Check ARCore availability and compatibility
- Handle AR session lifecycle (pause/resume)
- Display AR camera view in React Native screen

**FR-2: Plane Detection**
- Detect horizontal planes (floor/ground) using ARCore
- Visualize detected planes with semi-transparent overlay
- Filter planes by type (horizontal, vertical, etc.)
- Update plane visualization in real-time

**FR-3: Point Placement**
- Tap-to-place functionality on detected planes
- Raycast from screen touch to AR plane intersection
- Collect 3D world-space coordinates (x, y, z in meters)
- Minimum 2 points required, no maximum limit (within reason)

**FR-4: Visual Feedback**
- Display point markers at placed locations
- Show point numbers/labels
- Highlight active/selected points
- Provide visual confirmation on point placement

**FR-5: Point Management**
- Clear all points functionality
- Undo last point (optional)
- Display point count in real-time
- Show coordinates preview for each point

**FR-6: Data Export**
- Export collected points as JSON array
- Format: `[{ "x": 1.245, "y": 0.002, "z": -0.532 }, ...]`
- Save to app's internal storage or Downloads folder
- Return data directly to React Native via bridge (preferred)

#### 2.2 React Native Integration

**FR-7: Native Module Bridge**
- Create Kotlin native module for React Native
- Expose AR functionality via JavaScript interface
- Handle callbacks for point collection events
- Support promise-based async operations

**FR-8: Screen Integration**
- Integrate AR view into existing `ScanScreen.js`
- Replace mock scanner with native AR view
- Maintain existing UI/UX flow
- Support back navigation and state management

**FR-9: Data Flow**
- Stream point data from Kotlin to React Native in real-time
- Auto-populate `HomeScreen` with scanned data
- Maintain existing conversion pipeline
- Support file export if needed

### 3. Technical Requirements

#### 3.1 ARCore Integration

**TR-1: Dependencies**
- ARCore SDK (Google ARCore)
- Sceneform or ARCore native APIs
- Camera permissions and runtime handling

**TR-2: ARCore Features**
- Plane Detection API
- Raycast API for hit-testing
- World tracking and coordinate system
- Session configuration and management

**TR-3: Performance**
- Maintain 30+ FPS during AR session
- Efficient plane detection updates
- Optimize memory usage for point collection
- Handle low-end device compatibility

#### 3.2 Kotlin Native Module

**TR-4: Module Structure**
```
android/app/src/main/java/com/dxfconv/app/
├── ar/
│   ├── ARFloorScannerModule.kt      # React Native module
│   ├── ARFloorScannerPackage.kt      # Package registration
│   ├── ARFloorScannerView.kt         # AR view component
│   ├── ARPointCollector.kt           # Point collection logic
│   └── ARSessionManager.kt            # ARCore session management
```

**TR-5: React Native Bridge**
- Extend `ReactContextBaseJavaModule`
- Implement `ViewManager` for AR view component
- Use `Promise` for async operations
- Emit events via `DeviceEventEmitter`

**TR-6: Data Format**
- JSON serialization using Gson or Kotlinx.serialization
- Maintain exact format: `[{ "x": float, "y": float, "z": float }, ...]`
- Coordinate system: ARCore world space (meters)
- Precision: 3 decimal places minimum

#### 3.3 Permissions & Configuration

**TR-7: Android Permissions**
- `CAMERA` - Required for ARCore
- `INTERNET` - ARCore initialization
- `READ_EXTERNAL_STORAGE` - File import (if needed)
- `WRITE_EXTERNAL_STORAGE` - File export (if needed)

**TR-8: AndroidManifest.xml Updates**
- Add ARCore feature requirement
- Configure camera usage
- Set minimum API level for ARCore (API 24+)

**TR-9: Gradle Dependencies**
```gradle
dependencies {
    // ARCore
    implementation 'com.google.ar:core:1.40.0'
    
    // Sceneform (optional, for 3D rendering)
    // implementation 'com.google.ar.sceneform:core:1.17.1'
    
    // JSON serialization
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

### 4. User Experience Requirements

#### 4.1 AR Scanning Flow

**UX-1: Initialization**
- Check ARCore availability on app start
- Show loading state while initializing AR session
- Display error message if ARCore not supported
- Provide fallback to file import if AR unavailable

**UX-2: Scanning Interface**
- Full-screen AR camera view
- Overlay UI elements (point count, buttons)
- Clear visual indicators for detected planes
- Intuitive tap-to-place interaction

**UX-3: Point Collection**
- Immediate visual feedback on tap
- Point markers visible in AR space
- Real-time point count display
- Ability to clear points and restart

**UX-4: Completion**
- "Finish Scan" button (enabled when 2+ points)
- Export/return data to React Native
- Navigate back to HomeScreen with data
- Show success confirmation

#### 4.2 Error Handling

**UX-5: ARCore Errors**
- Device not supported message
- ARCore not installed prompt
- Camera permission denied handling
- AR session lost recovery

**UX-6: Data Validation**
- Minimum point requirement (2 points)
- Invalid coordinate handling
- Export failure recovery

### 5. Non-Functional Requirements

#### 5.1 Performance

**NFR-1: AR Performance**
- Maintain smooth AR tracking (30+ FPS)
- Low latency point placement (<100ms)
- Efficient memory usage (<200MB AR session)

**NFR-2: Battery Optimization**
- Pause AR session when app backgrounded
- Resume session efficiently
- Minimize CPU usage when idle

#### 5.2 Compatibility

**NFR-3: Device Support**
- Support all ARCore-compatible devices
- Minimum Android 7.0 (API 24)
- Handle devices without ARCore gracefully

**NFR-4: Backward Compatibility**
- Maintain existing JSON format
- Support existing file import workflow
- No breaking changes to React Native interface

#### 5.3 Code Quality

**NFR-5: Code Standards**
- Follow Kotlin coding conventions
- Comprehensive error handling
- Code comments and documentation
- Unit tests for critical functions

---

## 📐 Technical Architecture

### 1. Module Structure

```
ARFloorScannerModule (React Native Bridge)
    ├── ARSessionManager (ARCore Session)
    │   ├── Initialize ARCore
    │   ├── Configure plane detection
    │   └── Handle session lifecycle
    │
    ├── ARFloorScannerView (AR View Component)
    │   ├── Render AR camera feed
    │   ├── Display detected planes
    │   └── Handle touch input
    │
    └── ARPointCollector (Point Management)
        ├── Collect 3D coordinates
        ├── Store point data
        └── Export to JSON
```

### 2. Data Flow

```
User Tap → ARFloorScannerView
    ↓
Raycast to AR Plane → ARPointCollector
    ↓
Store Point (x, y, z) → Update UI
    ↓
Finish Scan → Export JSON → React Native Bridge
    ↓
ScanScreen.js → onScanComplete callback
    ↓
HomeScreen.js → Auto-populate data → Convert to DXF
```

### 3. React Native Interface

**JavaScript API:**
```javascript
// Start AR session
ARFloorScanner.startSession()
  .then(() => console.log('AR session started'))
  .catch(error => console.error(error));

// Place point (handled internally via touch)
// Points are emitted via events

// Get collected points
ARFloorScanner.getPoints()
  .then(points => console.log(points)); // [{x, y, z}, ...]

// Clear points
ARFloorScanner.clearPoints();

// Finish scan and export
ARFloorScanner.finishScan()
  .then(jsonData => {
    // Use data in HomeScreen
  });

// Event listeners
ARFloorScanner.addListener('onPointPlaced', (point) => {
  console.log('Point placed:', point);
});

ARFloorScanner.addListener('onPointCountChanged', (count) => {
  console.log('Point count:', count);
});
```

---

## 🎯 Implementation Phases

### Phase 1: ARCore Setup & Basic Integration
- [ ] Add ARCore dependencies to `build.gradle`
- [ ] Update `AndroidManifest.xml` with ARCore requirements
- [ ] Create basic AR session manager
- [ ] Test ARCore initialization

### Phase 2: React Native Bridge
- [ ] Create `ARFloorScannerModule.kt`
- [ ] Create `ARFloorScannerPackage.kt`
- [ ] Register module in `MainApplication.kt`
- [ ] Test JavaScript bridge communication

### Phase 3: AR View Component
- [ ] Create `ARFloorScannerView.kt` (ViewManager)
- [ ] Implement AR camera rendering
- [ ] Add plane detection visualization
- [ ] Integrate into `ScanScreen.js`

### Phase 4: Point Collection
- [ ] Implement raycast hit-testing
- [ ] Create point collection logic
- [ ] Add visual point markers
- [ ] Implement point management (clear, count)

### Phase 5: Data Export & Integration
- [ ] Implement JSON export
- [ ] Connect to React Native callbacks
- [ ] Test end-to-end flow (Scan → Home → Convert)
- [ ] Handle edge cases and errors

### Phase 6: Polish & Optimization
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] UI/UX refinements
- [ ] Testing on multiple devices

---

## 📝 JSON Data Format Specification

### Input/Output Format

```json
[
  { "x": 2.120, "y": 0.015, "z": 1.980 },
  { "x": 3.100, "y": -0.011, "z": 0.550 },
  { "x": 0.000, "y": 0.002, "z": 0.000 },
  { "x": 0.350, "y": -0.008, "z": 1.720 }
]
```

**Requirements:**
- Array of objects
- Each object has `x`, `y`, `z` properties (floats)
- Coordinates in meters (ARCore world space)
- Minimum 2 points required
- Maximum 100,000 points (enforced by converter)

**Coordinate System:**
- `x`: Horizontal axis (left-right)
- `y`: Vertical axis (up-down, typically small for floor)
- `z`: Depth axis (forward-backward)

---

## 🔍 Testing Requirements

### 1. Functional Testing
- AR session initialization
- Plane detection accuracy
- Point placement precision
- JSON export format validation
- React Native integration

### 2. Device Testing
- Test on multiple ARCore-compatible devices
- Test on devices without ARCore (fallback)
- Test on different Android versions (7.0+)
- Performance testing on low-end devices

### 3. Edge Cases
- No planes detected
- Camera permission denied
- ARCore not installed
- App backgrounded during scan
- Network issues during ARCore initialization

---

## 📚 References & Resources

### ARCore Documentation
- [ARCore Overview](https://developers.google.com/ar)
- [ARCore Android Developer Guide](https://developers.google.com/ar/develop/java/quickstart)
- [Plane Detection API](https://developers.google.com/ar/develop/java/depth/overview)
- [Raycast API](https://developers.google.com/ar/develop/java/computer-vision/arcore-hit-test)

### React Native Native Modules
- [Native Modules Guide](https://reactnative.dev/docs/native-modules-android)
- [Native UI Components](https://reactnative.dev/docs/native-components-android)
- [Event Emitter](https://reactnative.dev/docs/native-modules-android#sending-events-to-javascript)

### Kotlin Resources
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Kotlin Android Extensions](https://kotlinlang.org/docs/android-overview.html)

---

## ✅ Success Criteria

1. **Functional Success:**
   - AR floor scanning works natively within React Native app
   - Points collected match Unity AR output format
   - Seamless integration with existing conversion pipeline

2. **Performance Success:**
   - AR session maintains 30+ FPS
   - Point placement latency <100ms
   - App memory usage reasonable (<200MB AR session)

3. **User Experience Success:**
   - Single-app workflow (no Unity dependency)
   - Intuitive tap-to-place interaction
   - Clear visual feedback
   - Smooth data flow to conversion screen

4. **Technical Success:**
   - Clean Kotlin code following best practices
   - Proper error handling and edge cases
   - Comprehensive documentation
   - Maintainable and extensible architecture

---

## 📌 Notes

- This implementation replaces Unity AR but maintains 100% compatibility with existing JSON format
- The React Native app structure remains unchanged
- All existing conversion functionality (DXF/SVG/JSON) continues to work
- File import workflow remains as fallback option

---

**Document Status:** Ready for Implementation  
**Next Steps:** Begin Phase 1 - ARCore Setup & Basic Integration

