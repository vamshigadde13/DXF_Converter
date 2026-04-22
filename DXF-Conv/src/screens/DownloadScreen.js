import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function DownloadScreen({ fileContent, fileFormat, fileExtension, mimeType, onBack }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [fileUri, setFileUri] = useState(null);

    useEffect(() => {
        // Pre-generate file when component mounts or fileContent changes
        if (fileContent) {
            generateFile();
        }
    }, [fileContent]);

    const generateFile = async () => {
        if (!fileContent) return;

        try {
            const fileName = `output_${Date.now()}.${fileExtension || 'dxf'}`;
            const uri = FileSystem.documentDirectory + fileName;

            // Write file - UTF-8 is the default encoding, no need to specify
            await FileSystem.writeAsStringAsync(uri, fileContent);

            setFileUri(uri);
        } catch (error) {
            console.error('File generation error:', error);
            Alert.alert('Error', `Failed to generate ${fileFormat?.toUpperCase() || 'DXF'} file: ${error.message}`);
        }
    };

    const handleDownload = async () => {
        if (!fileUri) {
            Alert.alert('Error', `${fileFormat?.toUpperCase() || 'DXF'} file not ready. Please wait...`);
            return;
        }

        setIsDownloading(true);

        try {
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                // Share/Download the file
                await Sharing.shareAsync(fileUri, {
                    mimeType: mimeType || 'application/acad',
                    dialogTitle: `Save ${fileFormat?.toUpperCase() || 'DXF'} file`,
                });
                Alert.alert('Success', `${fileFormat?.toUpperCase() || 'DXF'} file is ready to download!`);
            } else {
                Alert.alert(
                    'Success',
                    `${fileFormat?.toUpperCase() || 'DXF'} file created at: ${fileUri}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', `Failed to download ${fileFormat?.toUpperCase() || 'DXF'} file`);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Download {fileFormat?.toUpperCase() || 'DXF'} File</Text>
                    <Text style={styles.subtitle}>
                        Your {fileFormat?.toUpperCase() || 'DXF'} file is ready for download
                    </Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>File Information</Text>
                    <Text style={styles.infoText}>
                        {fileFormat === 'dxf' && 'The DXF file has been generated from your coordinate data. Works for AutoCAD, ArtCAM, and CNC machines.'}
                        {fileFormat === 'svg' && 'The SVG file has been generated for visual validation and client preview. Open in any web browser or image viewer.'}
                        {fileFormat === 'json' && 'The JSON file has been generated for integration with other systems. Contains structured coordinate data.'}
                        {!fileFormat && 'The file has been generated from your coordinate data.'}
                    </Text>
                    <Text style={styles.infoText}>
                        Click the download button below to save it to your device.
                    </Text>
                </View>

                {fileUri ? (
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusText}>
                            ✓ File ready for download
                        </Text>
                    </View>
                ) : (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="small" color="#8b5cf6" />
                        <Text style={styles.statusText}>
                            Preparing file...
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        disabled={isDownloading}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.downloadButton,
                            (!fileUri || isDownloading) ? styles.buttonDisabled : null,
                        ]}
                        onPress={handleDownload}
                        disabled={!fileUri || isDownloading}
                    >
                        {isDownloading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.downloadButtonText}>
                                Download {fileFormat?.toUpperCase() || 'DXF'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    statusContainer: {
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        color: '#065f46',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    backButton: {
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
    downloadButton: {
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
    downloadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

