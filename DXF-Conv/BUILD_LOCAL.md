# Building Release APK Locally (Without Device/Emulator)

## Quick Build Command

```powershell
npm run build:apk:release
```

This will:
1. Run prebuild to ensure Android folder is up to date
2. Build the release APK using Gradle
3. Show you where the APK file is located

## Manual Build Steps

If you prefer to run commands manually:

### Step 1: Ensure Android folder exists
```powershell
npx expo prebuild --platform android
```

### Step 2: Build the release APK (no device needed)
```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

### Step 3: Find your APK
The APK will be located at:
```
android\app\build\outputs\apk\release\app-release.apk
```

### Step 4: Copy/Rename the APK (optional)
```powershell
copy android\app\build\outputs\apk\release\app-release.apk DXF-Converter-Release.apk
```

## Requirements

- **Java JDK** (version 11 or higher) - Required for Gradle
- **Android SDK** - But you don't need Android Studio or an emulator

If you don't have Java installed:
1. Download from: https://adoptium.net/
2. Install Java JDK 11 or higher
3. Add Java to your PATH environment variable

## Troubleshooting

### Error: "gradlew.bat is not recognized"
Make sure you're in the `android` folder when running the command.

### Error: "Java not found"
Install Java JDK and add it to your PATH.

### Error: "Android SDK not found"
You need Android SDK installed. You can:
- Install Android Studio (it includes SDK)
- Or install just the SDK command-line tools

### Build succeeds but APK not found
Check: `android\app\build\outputs\apk\release\app-release.apk`

## Alternative: Use EAS Build (Cloud - No Setup Needed)

If you don't want to install Java/Android SDK, use EAS Build instead:
```powershell
npm run build:android:apk
```

This builds in the cloud and doesn't require any local Android setup.

