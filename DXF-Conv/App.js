import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import DownloadScreen from './src/screens/DownloadScreen';
import ScanScreen from './src/screens/ScanScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [fileContent, setFileContent] = useState(null);
  const [fileFormat, setFileFormat] = useState('dxf');
  const [fileExtension, setFileExtension] = useState('dxf');
  const [mimeType, setMimeType] = useState('application/acad');
  const [scannedData, setScannedData] = useState(null);

  const handleConvertComplete = (content, originalData, format, extension, mime) => {
    setFileContent(content);
    setFileFormat(format || 'dxf');
    setFileExtension(extension || 'dxf');
    setMimeType(mime || 'application/acad');
    setCurrentScreen('download');
  };

  const handleScanComplete = (jsonData) => {
    // Store scanned data and navigate to home screen
    setScannedData(jsonData);
    setCurrentScreen('home');
  };

  const handleNavigateToScan = () => {
    setCurrentScreen('scan');
  };

  const handleBack = () => {
    setCurrentScreen('home');
    setFileContent(null);
    setFileFormat('dxf');
    setFileExtension('dxf');
    setMimeType('application/acad');
  };

  const handleBackFromScan = () => {
    setCurrentScreen('home');
  };

  return (
    <>
      {currentScreen === 'home' ? (
        <HomeScreen
          onConvertComplete={handleConvertComplete}
          onNavigateToScan={handleNavigateToScan}
          scannedData={scannedData}
          onScannedDataUsed={() => setScannedData(null)}
        />
      ) : currentScreen === 'scan' ? (
        <ScanScreen
          onScanComplete={handleScanComplete}
          onBack={handleBackFromScan}
        />
      ) : (
        <DownloadScreen
          fileContent={fileContent}
          fileFormat={fileFormat}
          fileExtension={fileExtension}
          mimeType={mimeType}
          onBack={handleBack}
        />
      )}
      <StatusBar style="auto" />
    </>
  );
}