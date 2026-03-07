# TASK-015: Update Root Layout (Fonts + GestureHandler)

## Status: DONE
## Group: 1 (Wave 1)
## Depends On: TASK-013

## Description
Update app/_layout.tsx to load Syne + Inter Google Fonts and wrap the app in GestureHandlerRootView + BottomSheetModalProvider.

## Files
- Modify: `vigil/mobile/app/_layout.tsx`

## Acceptance Criteria
1. Syne_700Bold, Syne_800ExtraBold loaded via useFonts from @expo-google-fonts/syne
2. Inter_400Regular, Inter_500Medium, Inter_600SemiBold loaded via useFonts from @expo-google-fonts/inter
3. SpaceMono still loaded from local assets
4. All fonts merged into single useFonts call
5. RootLayoutNav wrapped in `<GestureHandlerRootView style={{ flex: 1 }}>`
6. BottomSheetModalProvider wraps inside GestureHandlerRootView (required for @gorhom/bottom-sheet modals)
7. App launches without font loading errors

## Implementation
```typescript
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// In RootLayout useFonts:
const [loaded, error] = useFonts({
  SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  Syne_700Bold,
  Syne_800ExtraBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
});

// In RootLayoutNav:
function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={VigilDarkTheme}>
          <Stack ...>
            ...
          </Stack>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

## Reference
- Current layout: `vigil/mobile/app/_layout.tsx`
- Plan: `docs/plans/2026-03-07-screen-redesign.md` Task 4
