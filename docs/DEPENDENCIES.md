# VIGIL — Pre-configured Dependencies
# Copy these package.json files exactly to avoid version conflicts

---

## backend/package.json

```json
{
  "name": "vigil-backend",
  "version": "1.0.0",
  "description": "Vigil stablecoin watchdog backend",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "resend": "^3.2.0"
  }
}
```

NOTE: Do NOT install node-fetch. Use Node 18+ native fetch instead.
If you must use an older Node, add: "node-fetch": "^2.7.0" (v2, not v3)
and require it as: const fetch = require('node-fetch')

---

## mobile/package.json additions (on top of expo template)

After `npx create-expo-app mobile --template tabs`, run:

```bash
npx expo install expo-notifications expo-device react-native-svg
npm install axios @react-native-picker/picker
```

Resulting additions to package.json:
```json
{
  "dependencies": {
    "expo-notifications": "~0.28.0",
    "expo-device": "~6.0.0",
    "react-native-svg": "15.2.0",
    "axios": "^1.6.7",
    "@react-native-picker/picker": "2.7.5"
  }
}
```

---

## backend/.env template

```
RANGE_API_KEY=your_range_api_key_here
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.devvigil@yourdomain.com
PORT=3000
POLL_INTERVAL_SECONDS=60
```

## mobile — app.config.js

```javascript
export default {
  expo: {
    name: "Vigil",
    slug: "vigil",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vigil",
    userInterfaceStyle: "dark",
    splash: {
      backgroundColor: "#080808"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#3DFFA0"
        }
      ]
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      eas: {
        projectId: "YOUR_EAS_PROJECT_ID"
      }
    }
  }
};
```

---

## Quick start commands (run in order)

```bash
# 1. Backend
mkdir vigil && cd vigil
mkdir backend && cd backend
npm init -y
npm install express better-sqlite3 cors dotenv resend
# create .env with your keys
node index.js

# 2. Mobile (in new terminal)
cd vigil
npx create-expo-app mobile --template tabs
cd mobile
npx expo install expo-notifications expo-device react-native-svg
npm install axios @react-native-picker/picker
npx expo start

# 3. Get your local IP for mobile → backend connection
# Mac:
ipconfig getifaddr en0
# Windows:
ipconfig | findstr IPv4

# Set in mobile/.env:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```
