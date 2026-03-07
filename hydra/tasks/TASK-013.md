# TASK-013: Install Dependencies

## Status: DONE
## Group: 1 (Wave 1)
## Depends On: none

## Description
Install required packages for the screen redesign: Google Fonts (Syne, Inter), @gorhom/bottom-sheet, and react-native-gesture-handler.

## Files
- Modify: `vigil/mobile/package.json`

## Acceptance Criteria
1. `@expo-google-fonts/syne` installed
2. `@expo-google-fonts/inter` installed
3. `@gorhom/bottom-sheet` installed
4. `react-native-gesture-handler` installed
5. `react-native-reanimated` already present (4.2.1) — do NOT reinstall
6. All packages resolve without version conflicts

## Implementation Steps
1. Run: `cd vigil/mobile && npx expo install @expo-google-fonts/syne @expo-google-fonts/inter @gorhom/bottom-sheet react-native-gesture-handler`
2. Verify: check package.json has all 4 new dependencies
3. Run: `cd vigil/mobile && npm ls @gorhom/bottom-sheet react-native-gesture-handler` to confirm resolution

## Test
```bash
cd vigil/mobile && node -e "
const pkg = require('./package.json');
const deps = ['@expo-google-fonts/syne','@expo-google-fonts/inter','@gorhom/bottom-sheet','react-native-gesture-handler'];
deps.forEach(d => { if (!pkg.dependencies[d]) { console.error('MISSING:', d); process.exit(1); } });
console.log('All dependencies installed');
"
```
