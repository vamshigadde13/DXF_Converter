# Building Release APK for DXF Converter

## ✅ No Android Studio Required!

**You don't need Android Studio or Android SDK installed.** EAS Build runs in the cloud, so you can build APKs without any local Android setup.

## Two Ways to Get a Release APK:

### Option 1: EAS Build (Recommended - Cloud Build)
Build your release APK using Expo's cloud service - no Android files needed on your computer.

### Option 2: Pre-built APK
If you already have a release APK file, you can use it directly. Just install it on your Android device.

## Prerequisites

1. **Install EAS CLI** (Expo Application Services)
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo account**
   ```bash
   eas login
   ```
   (Create a free account at https://expo.dev if you don't have one)

## Build Configuration

The `eas.json` file is already configured in the project root. No additional setup needed!

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Option 1: Building a Release APK (Cloud Build - No Android Files Needed!)

### Step 1: Navigate to your project
```bash
cd DXF-Conv
```

### Step 2: Build the APK (Cloud Build)
```bash
eas build --platform android --profile production
```

**OR use the npm script:**
```bash
npm run build:android:apk
```

This will generate a release APK file that you can download and install.

---

## Option 2: Using an Existing Release APK File

If you already have a release APK file:

1. **Transfer the APK to your Android device** (via USB, email, or cloud storage)
2. **Enable "Install from Unknown Sources"** on your device:
   - Go to Settings → Security → Enable "Unknown Sources" or "Install Unknown Apps"
3. **Install the APK**:
   - Open the APK file on your device
   - Tap "Install"
   - The app will be installed with full file system permissions

## Build Process (All in the Cloud!)

1. **First time setup**: EAS will ask you to configure the project (just press Enter to use defaults)
2. The build will start on Expo's cloud servers (no local Android files needed!)
3. You'll get a URL to track the build progress (e.g., `https://expo.dev/accounts/your-account/builds/...`)
4. Wait 15-20 minutes for the build to complete
5. Once complete, you'll get a download link for the APK
6. Download the APK file to your computer
7. Transfer it to your Android device and install it

## Testing the APK

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer the APK to your device
3. Install and test file download functionality

## Notes

- ✅ **No Android Studio or SDK needed** - Everything builds in the cloud
- The first build may take 15-20 minutes
- Subsequent builds are usually faster
- Free Expo accounts have build limits (check expo.dev for current limits)
- The APK will be signed and ready for distribution
- You can monitor build progress at the URL provided during build

## Troubleshooting

If you get an error about "No Android project found", don't worry - that's normal. EAS will create the Android project automatically during the cloud build process.

