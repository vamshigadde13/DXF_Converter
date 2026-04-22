# Build Release APK Script for DXF Converter
# Run this script to build a release APK

Write-Host "Building Release APK..." -ForegroundColor Cyan
Write-Host ""

# Navigate to android folder and build
cd android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Build successful!" -ForegroundColor Green
    Write-Host ""
    
    # Copy APK to project root with a friendly name
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    $destination = "..\DXF-Converter-Release.apk"
    
    if (Test-Path $apkPath) {
        Copy-Item $apkPath -Destination $destination -Force
        $size = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
        Write-Host "✓ APK Location: $((Get-Item $destination).FullName)" -ForegroundColor Green
        Write-Host "✓ APK Size: $size MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ready to install on your Android device!" -ForegroundColor Yellow
    } else {
        Write-Host "✗ APK file not found at: $apkPath" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "✗ Build failed!" -ForegroundColor Red
}

cd ..

