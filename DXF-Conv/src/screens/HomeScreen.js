import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { convertInBackground } from '../utils/dxfConverter';

// Sample test data levels
const SAMPLE_DATA = {
    level1: `[
  { "x": 2.120, "y": 0.015, "z": 1.980 },
  { "x": 3.100, "y": -0.011, "z": 0.550 },
  { "x": 0.000, "y": 0.002, "z": 0.000 },
  { "x": 0.350, "y": -0.008, "z": 1.720 },
  { "x": 1.120, "y": 0.019, "z": 2.320 },
  { "x": 2.900, "y": -0.012, "z": 0.100 },
  { "x": 2.650, "y": 0.003, "z": 1.400 },
  { "x": 1.750, "y": -0.014, "z": 2.550 },
  { "x": 3.200, "y": 0.007, "z": 0.900 },
  { "x": 0.900, "y": -0.006, "z": 2.180 },
  { "x": 0.150, "y": 0.012, "z": 1.300 },
  { "x": 1.600, "y": -0.021, "z": 2.500 },
  { "x": 3.500, "y": 0.018, "z": 0.250 }
]
`,
    level2: `[
  { "x": 1.236, "y": 0.015, "z": 1.004 },
  { "x": 3.808, "y": -0.008, "z": 0.985 },
  { "x": 3.792, "y": 0.011, "z": 3.014 },
  { "x": 1.257, "y": 0.005, "z": 3.021 }
]`,
    level3: `[
  { "x": 1.24123, "y": -0.03412, "z": 0.99821 },
  { "x": 3.82144, "y": 0.02655, "z": 1.01355 },
  { "x": 3.80798, "y": -0.05144, "z": 3.01268 },
  { "x": 2.54311, "y": 0.02217, "z": 3.02711 },
  { "x": 1.25102, "y": -0.04788, "z": 3.00642 }
]`,
};

export default function HomeScreen({ onConvertComplete, onNavigateToScan, scannedData, onScannedDataUsed }) {
    const [textData, setTextData] = useState('');
    const [storedData, setStoredData] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('dxf'); // 'dxf', 'svg', 'json'

    // Auto-populate textData when scanned data arrives
    useEffect(() => {
        if (scannedData) {
            setTextData(scannedData);
            setStatusMessage('✅ Scanned data loaded from AR scan!');
            // Notify parent that we've used the scanned data
            if (onScannedDataUsed) {
                onScannedDataUsed();
            }
        }
    }, [scannedData]);

    const handleSave = () => {
        if (!textData.trim()) {
            Alert.alert('Error', 'Please enter some text data');
            return;
        }

        const trimmedData = textData.trim();

        // Store the text data
        setStoredData(trimmedData);
        setStatusMessage('Converting data in background...');
        setIsConverting(true);

        // Trigger background conversion
        convertInBackground(
            trimmedData,
            selectedFormat,
            (content, fileExtension, mimeType) => {
                // Conversion successful
                setIsConverting(false);
                setStatusMessage(`Conversion complete! Format: ${selectedFormat.toUpperCase()}`);

                // Notify parent component (App.js) to navigate to download screen
                if (onConvertComplete) {
                    onConvertComplete(content, trimmedData, selectedFormat, fileExtension, mimeType);
                }
            },
            (error) => {
                // Conversion failed
                setIsConverting(false);
                setStatusMessage('Conversion failed: ' + error.message);
                Alert.alert('Conversion Error', error.message);
            }
        );
    };

    const handleClear = () => {
        setTextData('');
        setStoredData(null);
        setStatusMessage('');
        setIsConverting(false);
    };

    const handleLoadSample = (level) => {
        const sampleData = SAMPLE_DATA[level];
        if (sampleData) {
            setTextData(sampleData);
            setStatusMessage(`Level ${level.charAt(level.length - 1)} sample data loaded`);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>DXF Converter</Text>
                    <Text style={styles.subtitle}>
                        Convert coordinate data to DXF, SVG, or JSON
                    </Text>
                </View>

                {onNavigateToScan && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={onNavigateToScan}
                    >
                        <Text style={styles.scanButtonText}>📱 AR Scan Floor Plan</Text>
                        <Text style={styles.scanButtonSubtext}>Use AR to scan and capture points</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.formatSection}>
                    <Text style={styles.formatLabel}>Output Format</Text>
                    <View style={styles.formatButtons}>
                        <TouchableOpacity
                            style={[
                                styles.formatButton,
                                selectedFormat === 'dxf' ? styles.formatButtonActive : null,
                            ]}
                            onPress={() => setSelectedFormat('dxf')}
                            disabled={isConverting}
                        >
                            <Text style={[
                                styles.formatButtonText,
                                selectedFormat === 'dxf' ? styles.formatButtonTextActive : null,
                            ]}>
                                ✓ DXF
                            </Text>
                            <Text style={styles.formatDescription}>AutoCAD, ArtCAM, CNC</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.formatButton,
                                selectedFormat === 'svg' ? styles.formatButtonActive : null,
                            ]}
                            onPress={() => setSelectedFormat('svg')}
                            disabled={isConverting}
                        >
                            <Text style={[
                                styles.formatButtonText,
                                selectedFormat === 'svg' ? styles.formatButtonTextActive : null,
                            ]}>
                                ✓ SVG
                            </Text>
                            <Text style={styles.formatDescription}>Visual validation</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.formatButton,
                                selectedFormat === 'json' ? styles.formatButtonActive : null,
                            ]}
                            onPress={() => setSelectedFormat('json')}
                            disabled={isConverting}
                        >
                            <Text style={[
                                styles.formatButtonText,
                                selectedFormat === 'json' ? styles.formatButtonTextActive : null,
                            ]}>
                                ✓ JSON
                            </Text>
                            <Text style={styles.formatDescription}>Integration</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputSection}>
                    <View style={styles.inputHeader}>
                        <Text style={styles.inputLabel}>Coordinate Data (JSON)</Text>
                        <View style={styles.sampleButtons}>
                            <TouchableOpacity
                                style={styles.sampleButton}
                                onPress={() => handleLoadSample('level1')}
                                disabled={isConverting}
                            >
                                <Text style={styles.sampleButtonText}>Level 1</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sampleButton}
                                onPress={() => handleLoadSample('level2')}
                                disabled={isConverting}
                            >
                                <Text style={styles.sampleButtonText}>Level 2</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sampleButton}
                                onPress={() => handleLoadSample('level3')}
                                disabled={isConverting}
                            >
                                <Text style={styles.sampleButtonText}>Level 3</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Enter your coordinate data here (JSON format)..."
                        placeholderTextColor="#999"
                        value={textData}
                        onChangeText={setTextData}
                    />
                </View>

                {statusMessage ? (
                    <View style={styles.statusContainer}>
                        {isConverting && (
                            <ActivityIndicator
                                size="small"
                                color="#10b981"
                                style={{ marginRight: 8 }}
                            />
                        )}
                        <Text style={styles.statusText}>{statusMessage}</Text>
                    </View>
                ) : null}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClear}
                    >
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            isConverting ? styles.buttonDisabled : null,
                        ]}
                        onPress={handleSave}
                        disabled={isConverting}
                    >
                        {isConverting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Convert to {selectedFormat.toUpperCase()}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {storedData ? (
                    <View style={styles.storedDataSection}>
                        <Text style={styles.storedDataTitle}>Stored Data:</Text>
                        <Text style={styles.storedDataText}>{storedData}</Text>
                    </View>
                ) : null}
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
    inputSection: {
        marginBottom: 16,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    sampleButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    sampleButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#e0e7ff',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#c7d2fe',
    },
    sampleButtonText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        fontSize: 14,
        color: '#1e293b',
        minHeight: 200,
    },
    statusContainer: {
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        color: '#065f46',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 6,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
        marginLeft: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: 'bold',
    },
    storedDataSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 16,
    },
    storedDataTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    storedDataText: {
        fontSize: 12,
        color: '#475569',
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 6,
    },
    formatSection: {
        marginBottom: 20,
    },
    formatLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    formatButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    formatButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        padding: 12,
        alignItems: 'center',
    },
    formatButtonActive: {
        borderColor: '#8b5cf6',
        backgroundColor: '#f3f4f6',
    },
    formatButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 4,
    },
    formatButtonTextActive: {
        color: '#8b5cf6',
    },
    formatDescription: {
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'center',
    },
    scanButton: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scanButtonSubtext: {
        color: '#e9d5ff',
        fontSize: 12,
    },
});