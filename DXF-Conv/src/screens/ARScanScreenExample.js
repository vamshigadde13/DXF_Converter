/**
 * Example React Native UI for AR Floor Scanner
 * Shows distances, area, and control buttons
 * 
 * Usage: Replace or integrate into your existing ScanScreen.js
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Button, Text, StyleSheet, NativeEventEmitter, NativeModules } from 'react-native';
import ARFloorScanner, { ARFloorScannerView } from '../modules/ARFloorScanner';

const { ARFloorScanner: ARFloorScannerNative } = NativeModules;
const eventEmitter = new NativeEventEmitter(ARFloorScannerNative);

export default function ARScanScreenExample({ onScanComplete, onBack }) {
  const [segments, setSegments] = useState([]);
  const [areaM2, setAreaM2] = useState(0);
  const [previewDist, setPreviewDist] = useState(-1);
  const [count, setCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Listen to points updated events
    const pointsUpdatedSub = eventEmitter.addListener('onPointsUpdated', (payload) => {
      if (payload.segments) {
        setSegments(payload.segments || []);
      }
      if (payload.area_m2 !== undefined) {
        setAreaM2(payload.area_m2 || 0);
      }
      if (payload.preview_distance_m !== undefined) {
        setPreviewDist(payload.preview_distance_m || -1);
      }
      if (payload.count !== undefined) {
        setCount(payload.count || 0);
      }
    });

    // Listen to point added events
    const pointAddedSub = ARFloorScanner.addListener((point) => {
      setCount(point.count || 0);
    });

    return () => {
      pointsUpdatedSub.remove();
      pointAddedSub();
    };
  }, []);

  const handleStartScan = async () => {
    try {
      await ARFloorScanner.startSession();
      setIsScanning(true);
    } catch (error) {
      console.error('Failed to start scan:', error);
    }
  };

  const handleUndo = async () => {
    try {
      await ARFloorScanner.undoLastPoint();
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  };

  const handleFinish = async () => {
    try {
      const jsonString = await ARFloorScanner.finishScan();
      await ARFloorScanner.stopSession();
      setIsScanning(false);
      if (onScanComplete) {
        onScanComplete(jsonString);
      }
    } catch (error) {
      console.error('Failed to finish scan:', error);
    }
  };

  const handleClear = async () => {
    try {
      await ARFloorScanner.clearPoints();
      setSegments([]);
      setAreaM2(0);
      setPreviewDist(-1);
      setCount(0);
    } catch (error) {
      console.error('Failed to clear:', error);
    }
  };

  if (!isScanning) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>AR Floor Scanner</Text>
        <Button title="Start Scan" onPress={handleStartScan} />
        <Button title="Back" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ARFloorScannerView style={styles.arView} />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>Points: {count}</Text>
          <Text style={styles.infoText}>
            Preview: {previewDist > 0 ? `${previewDist.toFixed(2)} m` : '-'}
          </Text>
          <Text style={styles.infoText}>
            Area: {areaM2.toFixed(2)} m² ({(areaM2 * 10.7639).toFixed(2)} ft²)
          </Text>
          
          {segments.length > 0 && (
            <View style={styles.segmentsContainer}>
              <Text style={styles.segmentsTitle}>Segment Distances:</Text>
              {segments.map((s, i) => (
                <Text key={i} style={styles.segmentText}>
                  {i + 1}: {s.toFixed(2)} m
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Button title="Add Point" onPress={() => {
            // Tap on screen to add points, or call addPointFromPreview if implemented
            console.log('Tap on AR view to add points');
          }} />
          <Button title="Undo" onPress={handleUndo} disabled={count === 0} />
          <Button title="Clear" onPress={handleClear} disabled={count === 0} />
          <Button title="Finish" onPress={handleFinish} disabled={count < 3} />
        </View>
      </View>
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  infoPanel: {
    marginBottom: 16,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 2,
  },
  segmentsContainer: {
    marginTop: 8,
  },
  segmentsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  segmentText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    margin: 20,
  },
});

