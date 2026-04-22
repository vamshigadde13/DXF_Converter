import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Linking,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';
import ARFloorScanner, { ARFloorScannerView } from '../modules/ARFloorScanner';

export default function ScanScreen({ onScanComplete, onBack }) {
    const [isScanning, setIsScanning] = useState(false);
    const [pointCount, setPointCount] = useState(0);
    const [isARSupported, setIsARSupported] = useState(false);
    const [isARInstalled, setIsARInstalled] = useState(false);
    const [arSupportMessage, setArSupportMessage] = useState('');
    const [isCheckingSupport, setIsCheckingSupport] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importedFileName, setImportedFileName] = useState(null);
    const [error, setError] = useState(null);
    const [detailedError, setDetailedError] = useState(null);
    const [showErrorCard, setShowErrorCard] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [showFeaturePoints, setShowFeaturePoints] = useState(true);
    const [surfaceDetected, setSurfaceDetected] = useState(false);
    const [featurePointCount, setFeaturePointCount] = useState(0);

    // Check camera permission status
    const checkCameraPermission = async () => {
        if (Platform.OS !== 'android') {
            setCameraPermission('granted');
            return;
        }

        try {
            const { status } = await Camera.getCameraPermissionsAsync();
            setCameraPermission(status);
        } catch (error) {
            console.error('Error checking camera permission:', error);
            setCameraPermission('undetermined');
        }
    };

    // Check AR support on mount
    useEffect(() => {
        checkARSupport();
        checkCameraPermission();

        // Setup event listeners
        const pointListener = ARFloorScanner.addListener((point) => {
            setPointCount(point.count || 0);
        });

        const errorListener = ARFloorScanner.addErrorListener((errorMessage) => {
            setError(errorMessage);
            Alert.alert('AR Error', errorMessage);
        });

        // Listen to surface detection events
        let surfaceDetectionListener = null;
        if (ARFloorScanner.addSurfaceDetectionListener) {
            surfaceDetectionListener = ARFloorScanner.addSurfaceDetectionListener((data) => {
                setSurfaceDetected(data.surfaceDetected || false);
                setFeaturePointCount(data.featurePointCount || 0);
            });
        }

        // Cleanup on unmount
        return () => {
            pointListener();
            errorListener();
            if (surfaceDetectionListener) surfaceDetectionListener();
            ARFloorScanner.removeAllListeners();
            if (isScanning) {
                ARFloorScanner.stopSession().catch(console.error);
            }
        };
    }, []);

    const checkARSupport = async () => {
        setIsCheckingSupport(true);
        setError(null);

        if (Platform.OS !== 'android') {
            setIsARSupported(false);
            setIsARInstalled(false);
            setArSupportMessage('AR Floor Scanner is only available on Android devices');
            setError('AR Floor Scanner is only available on Android devices');
            setIsCheckingSupport(false);
            return;
        }

        try {
            const result = await ARFloorScanner.isARSupported();

            // Handle both object and boolean formats
            const supported = typeof result === 'object' ? result.supported : result;
            const installed = typeof result === 'object' ? result.installed : result;
            const message = typeof result === 'object' ? result.message : (result ? 'ARCore is available' : 'ARCore is not available');

            setIsARSupported(supported);
            setIsARInstalled(installed);
            setArSupportMessage(message);

            if (!supported) {
                setError(message);
            } else if (!installed) {
                // Device supports ARCore but it's not installed
                setError(message);
            } else {
                setError(null);
            }
        } catch (error) {
            const errorMsg = `Failed to check AR support: ${error.message || error}`;
            setError(errorMsg);
            setArSupportMessage(errorMsg);
            setIsARSupported(false);
            setIsARInstalled(false);

            setDetailedError({
                title: 'AR Support Check Failed',
                message: 'Unable to verify ARCore availability on your device.',
                troubleshooting: '• Ensure your device is connected to internet\n' +
                    '• Check if ARCore is installed from Play Store\n' +
                    '• Restart the app and try again\n' +
                    '• Verify device supports ARCore',
                fullError: errorMsg
            });
            setShowErrorCard(true);
        } finally {
            setIsCheckingSupport(false);
        }
    };

    // Request camera permission
    const requestCameraPermission = async () => {
        if (Platform.OS !== 'android') {
            return true;
        }

        try {
            // Check current permission status
            const { status: existingStatus } = await Camera.getCameraPermissionsAsync();

            if (existingStatus === 'granted') {
                return true;
            }

            // Request permission
            const { status } = await Camera.requestCameraPermissionsAsync();

            if (status === 'granted') {
                return true;
            }

            // Permission denied
            Alert.alert(
                'Camera Permission Required',
                'AR scanning requires camera permission to work. Please grant camera permission in app settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings',
                        onPress: () => {
                            if (Platform.OS === 'android') {
                                Linking.openSettings();
                            }
                        }
                    }
                ]
            );
            return false;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            Alert.alert(
                'Permission Error',
                'Failed to request camera permission. Please grant camera permission manually in app settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Settings',
                        onPress: () => {
                            if (Platform.OS === 'android') {
                                Linking.openSettings();
                            }
                        }
                    }
                ]
            );
            return false;
        }
    };

    const handleStartScan = async () => {
        if (!isARSupported) {
            Alert.alert('AR Not Supported', arSupportMessage || error || 'ARCore is not available on this device');
            return;
        }

        if (!isARInstalled) {
            Alert.alert(
                'ARCore Not Installed',
                arSupportMessage || 'ARCore is supported on this device but needs to be installed. Please install ARCore from Google Play Store.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Install ARCore',
                        onPress: () => {
                            if (Platform.OS === 'android') {
                                Linking.openURL('https://play.google.com/store/apps/details?id=com.google.ar.core');
                            }
                        }
                    }
                ]
            );
            return;
        }

        // Request camera permission first
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            setError('Camera permission denied. Please grant camera permission to use AR scanning.');
            setDetailedError({
                title: 'Camera Permission Required',
                message: 'AR scanning requires camera permission to work.',
                troubleshooting: '• Tap "Open Settings" button above\n' +
                    '• Find "Camera" permission\n' +
                    '• Enable camera permission\n' +
                    '• Return to app and try again',
                fullError: 'Camera permission not granted'
            });
            setShowErrorCard(true);
            // Update permission status
            await checkCameraPermission();
            return;
        }

        // Update permission status after granting
        await checkCameraPermission();

        try {
            setError(null);
            setDetailedError(null);
            setShowErrorCard(false);

            // Clear previous points
            await ARFloorScanner.clearPoints();
            setPointCount(0);

            // Start AR session
            await ARFloorScanner.startSession();
            setIsScanning(true);

            Alert.alert(
                'AR Scanning Started',
                'Point camera at the floor and tap on detected planes to place points. Tap "Finish Scan" when done.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            const errorCode = error.code || '';
            const errorMessage = error.message || error.toString() || 'Unknown error occurred';

            // Create detailed error message based on error code
            let detailedMsg = errorMessage;
            let troubleshooting = '';

            if (errorCode === 'AR_NOT_AVAILABLE' || errorMessage.includes('not available')) {
                detailedMsg = 'ARCore is not available on this device.';
                troubleshooting = '• Check if ARCore is installed from Play Store\n' +
                    '• Verify your device supports ARCore\n' +
                    '• Restart the app and try again';
            } else if (errorCode === 'AR_START_ERROR' || errorMessage.includes('Camera') || errorMessage.includes('permission')) {
                detailedMsg = 'Camera permission or ARCore setup failed.';
                troubleshooting = '• Grant camera permission in app settings\n' +
                    '• Ensure ARCore is installed and updated\n' +
                    '• Close other apps using the camera\n' +
                    '• Restart the app';
            } else if (errorMessage.includes('session')) {
                detailedMsg = 'Failed to start AR session.';
                troubleshooting = '• Ensure ARCore is installed from Play Store\n' +
                    '• Check camera permissions\n' +
                    '• Close other camera apps\n' +
                    '• Restart your device if problem persists';
            }

            setError(errorMessage);
            setDetailedError({
                title: 'Failed to Start AR Scan',
                message: detailedMsg,
                troubleshooting: troubleshooting,
                fullError: errorMessage
            });
            setShowErrorCard(true);

            Alert.alert(
                'AR Scan Error',
                detailedMsg + (troubleshooting ? '\n\nTroubleshooting:\n' + troubleshooting : ''),
                [{ text: 'OK' }]
            );
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

            if (!Array.isArray(points) || points.length < 2) {
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
            const errorCode = error.code || '';
            const errorMessage = error.message || error.toString() || 'Unknown error occurred';

            let detailedMsg = errorMessage;
            let troubleshooting = '';

            if (errorCode === 'NO_POINTS' || errorCode === 'INSUFFICIENT_POINTS') {
                detailedMsg = errorMessage;
                troubleshooting = '• Tap on detected planes (grid overlay) in AR view\n' +
                    '• Wait for plane detection before tapping\n' +
                    '• Point camera at floor/ground surface\n' +
                    '• Ensure good lighting conditions';
            } else if (errorCode === 'EXPORT_ERROR') {
                detailedMsg = 'Failed to export scan data.';
                troubleshooting = '• Try clearing points and scanning again\n' +
                    '• Ensure you have at least 2 points\n' +
                    '• Restart the app if problem persists';
            }

            setError(errorMessage);
            setDetailedError({
                title: 'Scan Export Failed',
                message: detailedMsg,
                troubleshooting: troubleshooting,
                fullError: errorMessage
            });
            setShowErrorCard(true);

            Alert.alert(
                'Export Error',
                detailedMsg + (troubleshooting ? '\n\nTroubleshooting:\n' + troubleshooting : ''),
                [{ text: 'OK' }]
            );
        }
    };

    const handleReset = async () => {
        try {
            await ARFloorScanner.clearPoints();
            setPointCount(0);
            setError(null);
            setDetailedError(null);
            setShowErrorCard(false);

            if (isScanning) {
                await ARFloorScanner.stopSession();
                setIsScanning(false);
            }
        } catch (error) {
            const errorMsg = `Failed to reset: ${error.message || error}`;
            setError(errorMsg);
            setDetailedError({
                title: 'Reset Failed',
                message: 'Unable to reset scan session.',
                troubleshooting: '• Try again\n' +
                    '• Close and reopen the app if problem persists',
                fullError: errorMsg
            });
            setShowErrorCard(true);
        }
    };

    const handleClearPoints = async () => {
        try {
            await ARFloorScanner.clearPoints();
            setPointCount(0);
        } catch (error) {
            console.error('Failed to clear points:', error);
        }
    };

    // Handle point added event from AR view
    const handlePointAdded = (event) => {
        const { count } = event.nativeEvent;
        setPointCount(count || 0);
    };

    // Import JSON file (kept for backward compatibility)
    const handleImportJSON = async () => {
        try {
            setIsImporting(true);

            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                const jsonContent = await FileSystem.readAsStringAsync(result.uri);
                let parsedData;

                try {
                    parsedData = JSON.parse(jsonContent);
                } catch (parseError) {
                    Alert.alert('Invalid JSON', 'The selected file is not valid JSON format.');
                    setIsImporting(false);
                    return;
                }

                // Validate format
                if (!Array.isArray(parsedData)) {
                    Alert.alert('Invalid Format', 'JSON must be an array of point objects with x, y, z properties.');
                    setIsImporting(false);
                    return;
                }

                if (parsedData.length < 2) {
                    Alert.alert('Insufficient Points', 'JSON must contain at least 2 points.');
                    setIsImporting(false);
                    return;
                }

                const firstPoint = parsedData[0];
                if (!firstPoint || !firstPoint.hasOwnProperty('x') || !firstPoint.hasOwnProperty('z')) {
                    Alert.alert('Invalid Format', 'Each point must have x, y, and z properties.');
                    setIsImporting(false);
                    return;
                }

                const jsonString = JSON.stringify(parsedData, null, 2);
                setImportedFileName(result.name || 'ar_points.json');

                if (onScanComplete) {
                    onScanComplete(jsonString);
                }
            }
        } catch (error) {
            console.error('Import error:', error);
            Alert.alert('Import Error', error.message || 'Failed to import file.');
        } finally {
            setIsImporting(false);
        }
    };

    // Show loading state while checking AR support
    if (isCheckingSupport) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Checking AR support...</Text>
                </View>
            </View>
        );
    }

    // Show AR scanning view
    if (isScanning) {
        return (
            <View style={styles.container}>
                <ARFloorScannerView
                    style={styles.arView}
                    showFeaturePoints={showFeaturePoints}
                    onPointAdded={handlePointAdded}
                    onError={(event) => {
                        const errorMsg = event.nativeEvent?.message || 'AR Error occurred';
                        setError(errorMsg);
                        setDetailedError({
                            title: 'AR Runtime Error',
                            message: errorMsg,
                            troubleshooting: '• Try moving your device slowly\n' +
                                '• Ensure good lighting\n' +
                                '• Point at a flat horizontal surface\n' +
                                '• Restart scan if problem persists',
                            fullError: errorMsg
                        });
                        setShowErrorCard(true);
                    }}
                />

                {/* Overlay controls */}
                <View style={styles.overlay}>
                    {/* Error Banner */}
                    {error && showErrorCard && detailedError && (
                        <View style={styles.errorBanner}>
                            <View style={styles.errorBannerHeader}>
                                <Text style={styles.errorBannerTitle}>⚠️ {detailedError.title}</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowErrorCard(false);
                                        setError(null);
                                        setDetailedError(null);
                                    }}
                                    style={styles.errorCloseButton}
                                >
                                    <Text style={styles.errorCloseText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.errorBannerMessage}>{detailedError.message}</Text>
                            {detailedError.troubleshooting && (
                                <View style={styles.troubleshootingBox}>
                                    <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
                                    <Text style={styles.troubleshootingText}>{detailedError.troubleshooting}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.statusOverlay}>
                        <View style={[styles.statusIndicator, surfaceDetected && styles.statusIndicatorActive]} />
                        <Text style={styles.statusText}>
                            {surfaceDetected ? `Surface Detected (${featurePointCount} points)` : 'Scanning...'}
                        </Text>
                    </View>
                    <Text style={styles.pointCountText}>Points: {pointCount}</Text>

                    {/* Feature Points Toggle */}
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setShowFeaturePoints(!showFeaturePoints)}
                    >
                        <Text style={styles.toggleButtonText}>
                            {showFeaturePoints ? '●' : '○'} Feature Points
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClearPoints}
                        >
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.finishButton,
                                pointCount < 2 ? styles.buttonDisabled : null
                            ]}
                            onPress={handleFinishScan}
                            disabled={pointCount < 2}
                        >
                            <Text style={styles.finishButtonText}>Finish Scan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Main screen (not scanning)
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>AR Floor Plan Scanner</Text>
                    <Text style={styles.subtitle}>
                        Scan your floor plan using native ARCore technology
                    </Text>
                </View>

                {/* Detailed Error Card */}
                {error && showErrorCard && detailedError && (
                    <View style={styles.detailedErrorCard}>
                        <View style={styles.errorCardHeader}>
                            <Text style={styles.errorCardTitle}>⚠️ {detailedError.title}</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowErrorCard(false);
                                    setError(null);
                                    setDetailedError(null);
                                }}
                                style={styles.errorCloseButton}
                            >
                                <Text style={styles.errorCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.errorCardMessage}>{detailedError.message}</Text>
                        {detailedError.troubleshooting && (
                            <View style={styles.troubleshootingBox}>
                                <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
                                <Text style={styles.troubleshootingText}>{detailedError.troubleshooting}</Text>
                            </View>
                        )}
                        <Text style={styles.errorDetailsText}>Error Details: {detailedError.fullError}</Text>
                    </View>
                )}

                {/* AR Status Card */}
                <View style={[
                    styles.statusCard,
                    isARSupported && isARInstalled ? styles.statusCardSuccess :
                        isARSupported && !isARInstalled ? styles.statusCardWarning :
                            styles.statusCardError
                ]}>
                    <Text style={styles.statusLabel}>AR Status</Text>
                    <View style={styles.statusRow}>
                        <View style={[
                            styles.statusIndicator,
                            isARSupported && isARInstalled ? styles.statusActive :
                                isARSupported && !isARInstalled ? styles.statusWarning :
                                    styles.statusInactive
                        ]} />
                        <Text style={styles.statusText}>
                            {isARSupported && isARInstalled ? 'AR Ready ✓' :
                                isARSupported && !isARInstalled ? 'AR Supported (Not Installed)' :
                                    'AR Not Available'}
                        </Text>
                    </View>
                    {arSupportMessage && (
                        <Text style={styles.errorText}>{arSupportMessage}</Text>
                    )}
                    {/* Camera Permission Status */}
                    {isARSupported && cameraPermission !== null && (
                        <View style={styles.permissionRow}>
                            <View style={[
                                styles.statusIndicator,
                                cameraPermission === 'granted' ? styles.statusActive : styles.statusWarning
                            ]} />
                            <Text style={styles.permissionText}>
                                Camera: {cameraPermission === 'granted' ? 'Granted ✓' :
                                    cameraPermission === 'denied' ? 'Denied - Required for AR' :
                                        'Not Set - Will request when starting scan'}
                            </Text>
                        </View>
                    )}
                    {isARSupported && !isARInstalled && (
                        <TouchableOpacity
                            style={styles.installButton}
                            onPress={() => {
                                if (Platform.OS === 'android') {
                                    Linking.openURL('https://play.google.com/store/apps/details?id=com.google.ar.core');
                                }
                            }}
                        >
                            <Text style={styles.installButtonText}>
                                Install ARCore from Play Store
                            </Text>
                        </TouchableOpacity>
                    )}
                    {!isARSupported && (
                        <>
                            <Text style={styles.errorText}>
                                {arSupportMessage || 'ARCore is not available on this device.'}
                            </Text>
                            {arSupportMessage && (
                                arSupportMessage.includes('unknown') ||
                                arSupportMessage.includes('Error checking') ||
                                arSupportMessage.includes('timed out')
                            ) && (
                                    <TouchableOpacity
                                        style={styles.installButton}
                                        onPress={() => {
                                            if (Platform.OS === 'android') {
                                                Linking.openURL('https://play.google.com/store/apps/details?id=com.google.ar.core');
                                            }
                                        }}
                                    >
                                        <Text style={styles.installButtonText}>
                                            Try Installing ARCore from Play Store
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            {arSupportMessage && arSupportMessage.includes('not supported on this device') && (
                                <Text style={styles.errorText}>
                                    Your device hardware does not support ARCore. AR scanning will not be available.
                                </Text>
                            )}
                        </>
                    )}
                </View>

                {/* Native AR Scanner Card */}
                {isARSupported && (
                    <View style={styles.arCard}>
                        <Text style={styles.arTitle}>🎯 Native AR Scanner</Text>
                        <Text style={styles.arSubtitle}>
                            Use the built-in ARCore scanner to scan your floor plan directly in the app.
                        </Text>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={handleStartScan}
                        >
                            <Text style={styles.startButtonText}>🚀 Start AR Scan</Text>
                        </TouchableOpacity>
                        <Text style={styles.instructionText}>
                            • Point camera at floor/ground{'\n'}
                            • Wait for plane detection{'\n'}
                            • Tap on detected planes to place points{'\n'}
                            • Collect at least 2 points{'\n'}
                            • Tap "Finish Scan" to export
                        </Text>
                    </View>
                )}

                {/* Divider */}
                {isARSupported && (
                    <View style={styles.divider}>
                        <Text style={styles.dividerText}>OR</Text>
                    </View>
                )}

                {/* Import JSON File Card */}
                <View style={styles.importCard}>
                    <Text style={styles.importTitle}>📁 Import JSON File</Text>
                    <Text style={styles.importSubtitle}>
                        Import previously exported AR scan data or Unity AR JSON files.
                    </Text>
                    <TouchableOpacity
                        style={styles.importButton}
                        onPress={handleImportJSON}
                        disabled={isImporting}
                    >
                        {isImporting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.importButtonText}>Import JSON File</Text>
                        )}
                    </TouchableOpacity>
                    {importedFileName && (
                        <View style={styles.importedFileCard}>
                            <Text style={styles.importedFileText}>
                                ✅ Last imported: {importedFileName}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>ℹ️ About Native AR Scanner</Text>
                    <Text style={styles.infoText}>
                        The Native Kotlin AR Scanner uses ARCore for accurate plane detection and point placement.
                        {'\n\n'}
                        <Text style={styles.boldText}>Features:</Text>
                        {'\n'}
                        • Real-time plane detection
                        {'\n'}
                        • Tap-to-place points on detected surfaces
                        {'\n'}
                        • Accurate 3D coordinate tracking
                        {'\n'}
                        • JSON export matching Unity format
                        {'\n\n'}
                        <Text style={styles.boldText}>Requirements:</Text>
                        {'\n'}
                        • Android device with ARCore support
                        {'\n'}
                        • ARCore installed from Google Play Store
                        {'\n'}
                        • Camera permissions granted
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                >
                    <Text style={styles.backButtonText}>← Back to Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        paddingTop: 40,
    },
    scrollContent: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    // AR View styles
    arView: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        paddingBottom: 40,
    },
    statusOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    pointCountText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    clearButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    finishButton: {
        flex: 2,
        backgroundColor: '#8b5cf6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    finishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    // Status card
    statusCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    statusCardSuccess: {
        backgroundColor: '#f0fdf4',
        borderColor: '#10b981',
    },
    statusCardWarning: {
        backgroundColor: '#fffbeb',
        borderColor: '#f59e0b',
    },
    statusCardError: {
        backgroundColor: '#fef2f2',
        borderColor: '#ef4444',
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3b82f6',
        marginRight: 8,
    },
    statusIndicatorActive: {
        backgroundColor: '#10b981', // Green when surface detected
    },
    toggleButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    statusActive: {
        backgroundColor: '#10b981',
    },
    statusWarning: {
        backgroundColor: '#f59e0b',
    },
    statusInactive: {
        backgroundColor: '#ef4444',
    },
    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    permissionText: {
        fontSize: 13,
        color: '#475569',
        flex: 1,
    },
    errorText: {
        fontSize: 12,
        color: '#dc2626',
        marginTop: 8,
        lineHeight: 18,
    },
    installButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
    },
    installButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // AR Card
    arCard: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    arTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    arSubtitle: {
        fontSize: 14,
        color: '#e9d5ff',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    startButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    startButtonText: {
        color: '#8b5cf6',
        fontSize: 16,
        fontWeight: 'bold',
    },
    instructionText: {
        fontSize: 12,
        color: '#e9d5ff',
        lineHeight: 20,
    },
    // Import Card
    importCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    importTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    importSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
        lineHeight: 20,
    },
    importButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    importButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    importedFileCard: {
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    importedFileText: {
        color: '#10b981',
        fontSize: 12,
        textAlign: 'center',
    },
    divider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
    },
    // Info Card
    infoCard: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#78350f',
        lineHeight: 18,
    },
    boldText: {
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    backButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    // Error Banner (in AR view overlay)
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#dc2626',
    },
    errorBannerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    errorBannerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    errorBannerMessage: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    // Detailed Error Card (main screen)
    detailedErrorCard: {
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    errorCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    errorCardTitle: {
        color: '#dc2626',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    errorCardMessage: {
        color: '#991b1b',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    errorCloseButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    errorCloseText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: 'bold',
    },
    troubleshootingBox: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    troubleshootingTitle: {
        color: '#92400e',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    troubleshootingText: {
        color: '#78350f',
        fontSize: 13,
        lineHeight: 20,
    },
    errorDetailsText: {
        color: '#991b1b',
        fontSize: 11,
        fontFamily: 'monospace',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(220, 38, 38, 0.2)',
    },
});
