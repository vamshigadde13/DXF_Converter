# Quick Build Commands

## Option 1: Run the PowerShell Script (Easiest)

```powershell
.\build-apk.ps1
```

This will:
- Build the release APK
- Copy it to `DXF-Converter-Release.apk` in the project root
- Show you the location and size

## Option 2: Manual Commands

### Step 1: Build the APK
```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

### Step 2: Copy the APK (optional)
```powershell
Copy-Item "android\app\build\outputs\apk\release\app-release.apk" -Destination "DXF-Converter-Release.apk"
```

## Option 3: Using npm Script

```powershell
npm run build:apk:release
```

## APK Location

After building, your APK will be at:
- **Original**: `android\app\build\outputs\apk\release\app-release.apk`
- **Copied**: `DXF-Converter-Release.apk` (in project root)

## Notes

- Build time: ~3-5 minutes
- APK size: ~54 MB
- No device/emulator needed for building
- The APK is signed and ready to install

