# Vigil Mobile App - Screen Redesign to Match HTML Mockups

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite all 6 Vigil mobile screens to be a 1:1 match with the HTML mockup designs in `docs/design/screens/`.

**Architecture:** Replace all existing screen and component styles with design tokens from a central theme file. Replace `<Modal>` with `@gorhom/bottom-sheet`. Replace `@react-native-picker/picker` with custom `NetworkChips` component. Load Syne + Inter Google Fonts via expo.

**Tech Stack:** Expo 55, React Native 0.83, TypeScript, @gorhom/bottom-sheet, @expo-google-fonts/syne, @expo-google-fonts/inter, react-native-gesture-handler, react-native-svg

---

## Task 1: Install Dependencies

**Files:**
- Modify: `vigil/mobile/package.json`

**Step 1: Install font packages and bottom sheet + gesture handler**

Run:
```bash
cd "/Users/josemejia/Documents/Software Development/Range/vigil/mobile" && npx expo install @expo-google-fonts/syne @expo-google-fonts/inter @gorhom/bottom-sheet react-native-gesture-handler
```

Expected: packages added to package.json dependencies. `react-native-reanimated` (4.2.1) already installed.

**Step 2: Verify installation**

Run:
```bash
cd "/Users/josemejia/Documents/Software Development/Range/vigil/mobile" && node -e "const pkg = require('./package.json'); console.log('@gorhom/bottom-sheet:', !!pkg.dependencies['@gorhom/bottom-sheet']); console.log('gesture-handler:', !!pkg.dependencies['react-native-gesture-handler']); console.log('syne:', !!pkg.dependencies['@expo-google-fonts/syne']); console.log('inter:', !!pkg.dependencies['@expo-google-fonts/inter']);"
```

Expected: all `true`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install bottom-sheet, gesture-handler, Syne and Inter fonts"
```

---

## Task 2: Create Theme Tokens

**Files:**
- Create: `vigil/mobile/constants/theme.ts`

**Step 1: Create the theme file**

```typescript
// Design tokens matching HTML mockup CSS variables exactly
export const Colors = {
  bg: '#080808',
  s1: '#111111',
  s2: '#181818',
  s3: '#202020',
  border: '#242424',
  border2: '#2e2e2e',
  accent: '#3DFFA0',
  accent10: 'rgba(61,255,160,0.10)',
  accent20: 'rgba(61,255,160,0.20)',
  warn: '#F5A623',
  danger: '#FF3B30',
  critical: '#FF2D55',
  t1: '#FFFFFF',
  t2: '#888888',
  t3: '#444444',
} as const;

export const NetworkColors: Record<string, string> = {
  ethereum: '#627EEA',
  solana: '#9945FF',
  tron: '#FF4040',
  'cosmoshub-4': '#6B75CA',
  'osmosis-1': '#750BBB',
  stellar: '#0099CC',
};

export const Fonts = {
  syneBold: 'Syne_700Bold',
  syneExtraBold: 'Syne_800ExtraBold',
  spaceMono: 'SpaceMono',
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
} as const;

export const Radii = {
  card: 14,
  badge: 10,
  button: 12,
  sheet: 28,
} as const;
```

**Step 2: Commit**

```bash
git add vigil/mobile/constants/theme.ts
git commit -m "feat: add central design tokens matching HTML mockups"
```

---

## Task 3: Fix Networks Constant

**Files:**
- Modify: `vigil/mobile/constants/networks.ts`

**Step 1: Fix Osmosis color**

In `vigil/mobile/constants/networks.ts`, change:
```
{ id: 'osmosis-1', name: 'Osmosis', symbol: 'OSMO', color: '#5E12A0' },
```
to:
```
{ id: 'osmosis-1', name: 'Osmosis', symbol: 'OSMO', color: '#750BBB' },
```

This matches the HTML mockup (`screen-06-addwallet.html` line 176: `background:#750BBB`).

**Step 2: Commit**

```bash
git add vigil/mobile/constants/networks.ts
git commit -m "fix: correct Osmosis color to match HTML mockup"
```

---

## Task 4: Update Root Layout (Fonts + GestureHandler)

**Files:**
- Modify: `vigil/mobile/app/_layout.tsx`

**Step 1: Update the root layout**

Changes needed:
1. Import and load Syne fonts (`Syne_700Bold`, `Syne_800ExtraBold`) via `useFonts` from `@expo-google-fonts/syne`
2. Import and load Inter fonts (`Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`) via `useFonts` from `@expo-google-fonts/inter`
3. Merge all font maps into the existing `useFonts` call (which already loads SpaceMono)
4. Import `GestureHandlerRootView` from `react-native-gesture-handler`
5. Wrap `<ThemeProvider>` inside `<GestureHandlerRootView style={{ flex: 1 }}>`

The existing `useFonts` call at line 89 loads `SpaceMono`. Expand it to also load:
```typescript
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// In RootLayout:
const [loaded, error] = useFonts({
  SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  Syne_700Bold,
  Syne_800ExtraBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
});

// In RootLayoutNav, wrap:
function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={VigilDarkTheme}>
        <Stack ...>
          ...
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

**Step 2: Run to verify fonts load**

Run:
```bash
cd "/Users/josemejia/Documents/Software Development/Range/vigil/mobile" && npx expo start --ios
```

Expected: App launches without font loading errors. Verify in console: no `fontFamily` warnings.

**Step 3: Commit**

```bash
git add vigil/mobile/app/_layout.tsx
git commit -m "feat: load Syne + Inter fonts, wrap in GestureHandlerRootView"
```

---

## Task 5: Create NetworkChips Component

**Files:**
- Create: `vigil/mobile/components/NetworkChips.tsx`

**Step 1: Create the component**

Two layout modes per HTML mockups:
- **Grid mode** (screen-06 Add Wallet): 3-column grid, each cell shows colored dot + symbol + full name. Selected cell gets network-colored border + 10% opacity bg.
- **Row mode** (screen-05 SafeSend): horizontal scrollable row of chips. Selected chip gets network-colored border + 15% opacity bg.

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NETWORKS, Network } from '../constants/networks';
import { Colors, Fonts, Radii } from '../constants/theme';

interface NetworkChipsProps {
  networks?: Network[];
  selected: string;
  onSelect: (networkId: string) => void;
  layout: 'grid' | 'row';
}

export default function NetworkChips({
  networks = NETWORKS,
  selected,
  onSelect,
  layout,
}: NetworkChipsProps) {
  if (layout === 'grid') {
    return (
      <View style={styles.grid}>
        {networks.map((n) => {
          const isSelected = selected === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.gridCell,
                isSelected && {
                  borderColor: n.color + '80',
                  backgroundColor: n.color + '1A',
                },
              ]}
              onPress={() => onSelect(n.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: n.color }]} />
              <Text style={[styles.gridSymbol, { color: n.color }]}>{n.symbol}</Text>
              <Text style={styles.gridName}>{n.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Row mode
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
      <View style={styles.row}>
        {networks.map((n) => {
          const isSelected = selected === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.chip,
                isSelected
                  ? { borderColor: n.color + '66', backgroundColor: n.color + '26' }
                  : { borderColor: Colors.border, backgroundColor: 'transparent' },
              ]}
              onPress={() => onSelect(n.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? n.color : Colors.t3 },
                ]}
              >
                {n.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Grid mode (Add Wallet bottom sheet)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  gridCell: {
    width: '31.5%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.s2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gridSymbol: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  gridName: {
    fontFamily: Fonts.interRegular,
    fontSize: 9,
    color: Colors.t3,
  },
  // Row mode (SafeSend)
  rowScroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    fontWeight: '700',
  },
});
```

**Step 2: Commit**

```bash
git add vigil/mobile/components/NetworkChips.tsx
git commit -m "feat: add NetworkChips component with grid and row modes"
```

---

## Task 6: Rewrite RiskBadge

**Files:**
- Modify: `vigil/mobile/components/RiskBadge.tsx`

**Step 1: Rewrite to match HTML `.br` class**

The HTML mockups use a pill-style badge with Space Mono font, letter-spacing 0.5, color-coded with 15% opacity background and 30% opacity border. Replace the current dot+text layout.

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../constants/theme';

const LEVEL_META: Record<string, { color: string; label: string }> = {
  VERY_LOW: { color: Colors.accent, label: 'VERY LOW' },
  LOW:      { color: Colors.accent, label: 'LOW' },
  MEDIUM:   { color: Colors.warn, label: 'MEDIUM' },
  HIGH:     { color: Colors.danger, label: 'HIGH' },
  CRITICAL: { color: Colors.critical, label: 'CRITICAL' },
};

interface RiskBadgeProps {
  riskLevel: string;
}

export default function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const normalized = riskLevel.toUpperCase().replace(/[\s-]/g, '_');
  const meta = LEVEL_META[normalized] || { color: Colors.t2, label: riskLevel.toUpperCase() };

  return (
    <View style={[styles.badge, {
      backgroundColor: meta.color + '1A',
      borderColor: meta.color + '4D',
    }]}>
      <Text style={[styles.label, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.5,
  },
});
```

**Step 2: Commit**

```bash
git add vigil/mobile/components/RiskBadge.tsx
git commit -m "feat: rewrite RiskBadge as pill-style badge matching HTML mockups"
```

---

## Task 7: Rewrite WalletCard

**Files:**
- Modify: `vigil/mobile/components/WalletCard.tsx`

**Step 1: Full rewrite matching HTML `.wcard` design**

Key changes from HTML screen-01:
- Card: `#181818` bg (was `#111111`), `borderRadius: 14`, `padding: 14`
- Row 1: wallet name (Syne 700 13px) + pulsing green dot (if active) on left; balance + relative time on right
- Row 2: Network badge (`.bn` class - colored text, 10% bg, border) + RiskBadge
- Row 3: Full address in Space Mono 9px, color `#444444`
- Row 4: Contagion pill (`.cpill`): `#202020` bg, spider emoji, score, "CONTAGION . N risky neighbors", 3px progress bar

The card should accept `wallet: Wallet` and `onPress`. The `active` variant (first wallet in list) gets `borderColor: rgba(61,255,160,0.25)` and a 2px accent gradient line at top.

Read existing `WalletCard.tsx` for reference. Import `RiskBadge` and use theme tokens.

Data mapping:
- `wallet.label` -> wallet name (or truncated address if no label)
- `wallet.network` -> lookup from `NETWORK_MAP` for symbol + color
- `wallet.contagion_score` -> contagion pill score + progress bar width (`score * 10`%)
- `wallet.last_activity` -> relative timestamp
- Risk level derived from contagion score: <2=VERY LOW, <4=LOW, <6=MEDIUM, <8=HIGH, >=8=CRITICAL

The contagion pill progress bar color matches the score color: green (<4), warn (4-6), danger (>6).

Note on "active" state: The first wallet (most recently active) gets the active border. Pass an `isActive?: boolean` prop.

**Step 2: Verify visually**

Open the app and compare the wallet card against `screen-01-wallets.html` opened in browser side-by-side.

**Step 3: Commit**

```bash
git add vigil/mobile/components/WalletCard.tsx
git commit -m "feat: rewrite WalletCard to match HTML mockup design"
```

---

## Task 8: Update ContagionGraph

**Files:**
- Modify: `vigil/mobile/components/ContagionGraph.tsx`

**Step 1: Update to match HTML screen-02**

Changes needed (minimal - existing graph is close):
- Remove the `scoreHeader` section from ContagionGraph (it will be in wallet-detail.tsx instead as a separate stats grid)
- Remove the `contagionBadge` from the graph
- Center "YOU" node: accent stroke, 20px outer radius (currently 24, change to 20)
- Inner circle: 12px radius (currently 16, change to 12)
- Edges: dashed (`strokeDasharray: '4,4'`) for safe, solid for risky (already done)
- Legend: horizontal row at bottom with colored dots + labels (already done)
- Graph wrap: bg `#181818` with `borderRadius: 14`, `border: 1px solid #242424`, `height: 180`
- Add `<RadialGradient>` on root (already done but tune opacity to `0.08` start per HTML)

Keep existing `onNodePress` tooltip functionality.

**Step 2: Commit**

```bash
git add vigil/mobile/components/ContagionGraph.tsx
git commit -m "feat: update ContagionGraph to match HTML mockup styling"
```

---

## Task 9: Rewrite AlertItem

**Files:**
- Modify: `vigil/mobile/components/AlertItem.tsx`

**Step 1: Full rewrite to match HTML screen-03**

Two distinct modes from HTML:

**ACT NOW mode** (HIGH/CRITICAL) - matches `.acard.urgent`:
- Card with `borderColor: rgba(255,59,48,0.35)` for HIGH, `rgba(255,45,85,0.4)` for CRITICAL
- Banner (`.act-banner`): gradient bg `linear-gradient(90deg, rgba(255,59,48,0.18), rgba(255,45,85,0.10))`, lightning/skull emoji + "ACT NOW" in Syne 800 11px + timestamp
- Body (`.abody`): 36x36 icon box (up/down arrow with risk-colored bg) + alert title (Syne 700 12px) with "NEW" pill + network badge + risk badge
- Action preview (`.act-preview`): first 2 actions as rows with emoji label + arrow, then "+ N more actions . tap to open"

**Normal mode** (LOW/MEDIUM) - matches `.acard` without `.urgent`:
- Single `.abody` row: 36x36 icon box + title + badges + timestamp
- No banner, no action preview

Data mapping from `Alert` type:
- `alert.risk_level` -> determines ACT NOW vs Normal mode
- `alert.message` -> title (e.g. "Sent 2,500 USDC")
- `alert.sent_at` -> relative timestamp
- `alert.acknowledged === 0` -> show "NEW" pill
- `alert.act_now_actions` -> action preview rows
- Direction emoji: "Sent" in message -> up arrow, "Received" -> down arrow
- Network: extract from `alert.wallet_address` or use a network field if available

**Step 2: Commit**

```bash
git add vigil/mobile/components/AlertItem.tsx
git commit -m "feat: rewrite AlertItem to match HTML mockup with ACT NOW banners"
```

---

## Task 10: Rewrite ActNowCard as Bottom Sheet

**Files:**
- Modify: `vigil/mobile/components/ActNowCard.tsx`

**Step 1: Replace Modal with @gorhom/bottom-sheet**

Match HTML screen-04 exactly:
- Use `BottomSheetModal` from `@gorhom/bottom-sheet`
- Handle bar: 40x4px, `#2e2e2e` bg, centered
- Sheet bg: `#111111`, top border radius 28px
- **Risk header** (`.risk-header`):
  - 52x52 emoji box with risk-colored bg + border
  - "HIGH RISK" label in Syne 800 26px, danger color
  - Score bar: 4px height, border bg, gradient fill (warn->danger), width = `score * 10`%
  - Score number: Space Mono 10px "8.2 / 10"
- **TX details box** (`.tx-box`): `#181818` bg, rounded, rows of key-value pairs:
  - DIRECTION: "OUTGOING" (danger color) or "INCOMING"
  - AMOUNT: from alert message
  - NETWORK: from wallet network
  - TO: truncated counterparty address
  - OFAC: "SANCTIONED" (danger) or "Clean"
- **Actions** (`.actions`): numbered 01-04, color-coded:
  - `.action.critical`: red bg/border
  - `.action.high`: orange/warn bg/border
  - `.action.medium`: green/accent bg/border
  - Each action: number (Space Mono 11px) + label (Syne 700 12px) + description (Inter 11px) + arrow
- **"Mark as Handled"** button: `#181818` bg, `#242424` border, centered text

Props stay the same: `alert, visible, onClose, onAcknowledge, onActionPress`. But instead of `visible` controlling a Modal, use `BottomSheetModal` ref with `present()` / `dismiss()`.

**Important:** The parent (alerts.tsx) will need to manage a ref instead of a `visible` boolean. The ActNowCard should accept a `bottomSheetRef` prop or use `forwardRef`.

Alternative simpler approach: Keep using a `visible` prop and have ActNowCard internally use `useEffect` to call `ref.current?.present()` when visible becomes true and `ref.current?.dismiss()` when false.

**Step 2: Commit**

```bash
git add vigil/mobile/components/ActNowCard.tsx
git commit -m "feat: rewrite ActNowCard as bottom sheet matching HTML mockup"
```

---

## Task 11: Update Tab Layout

**Files:**
- Modify: `vigil/mobile/app/(tabs)/_layout.tsx`

**Step 1: Update SafeSend icon and header**

Changes from HTML mockups:
1. SafeSend tab icon: change from `magnifyingglass`/`search` to `paperplane.fill`/`send`
2. Header for Wallets tab: add "BY RANGE" subtitle below "VIGIL" in `HeaderTitle`
3. Tab bar style: bg `#111111` (matches `--s1`), border `#242424` (matches `--border`)

In `HeaderTitle`, add:
```typescript
<Text style={styles.byRange}>BY RANGE</Text>
```
With style: `fontFamily: 'SpaceMono', fontSize: 7, color: '#3DFFA0', letterSpacing: 2.5, marginTop: 2`

The `headerRight` for Wallets tab will be handled in Task 12 (index.tsx sets it via `navigation.setOptions`).

**Step 2: Commit**

```bash
git add "vigil/mobile/app/(tabs)/_layout.tsx"
git commit -m "feat: update tab icons and header to match HTML mockups"
```

---

## Task 12: Rewrite Wallets Screen (index.tsx)

**Files:**
- Modify: `vigil/mobile/app/(tabs)/index.tsx`

**Step 1: Full rewrite to match HTML screen-01 + screen-06**

Key changes:
1. **Remove FAB button** (+), replace with header-right "Add" button (green bg, Syne 700, + icon)
2. **Add pulsing green dot** next to the Add button in header right
3. **Add "WATCHING" section label** with wallet count badge above the FlatList
4. **Use rewritten WalletCard** (first wallet gets `isActive={true}`)
5. **Replace Modal with BottomSheet** for Add Wallet:
   - Use `BottomSheetModal` from `@gorhom/bottom-sheet`
   - Sheet bg: `#111111`, top radius 28px
   - Handle bar + sheet header: "Watch a Wallet" (Syne 800 18px) + close button (round, `#181818` bg)
   - Address field: Space Mono 10px, `#181818` bg, `#2e2e2e` border, green focus state
   - Helper text: "Paste any ETH, SOL, TRX, ATOM, OSMO or XLM address"
   - Network picker: `NetworkChips` in grid mode (replaces `Picker`)
   - Label + Email: side-by-side row, both optional
   - Submit: "Watch Wallet" with shield emoji, accent bg, Syne 800 15px

Remove `@react-native-picker/picker` import.

Use `useNavigation` + `setOptions` to set the headerRight with the pulsing dot + Add button.

**Step 2: Verify Add Wallet bottom sheet**

- Opens from header "Add" button
- Network grid shows 6 networks, selection highlights correctly
- Submit creates wallet and refreshes list

**Step 3: Commit**

```bash
git add "vigil/mobile/app/(tabs)/index.tsx"
git commit -m "feat: rewrite Wallets screen with section labels and bottom sheet"
```

---

## Task 13: Rewrite Alerts Screen

**Files:**
- Modify: `vigil/mobile/app/(tabs)/alerts.tsx`

**Step 1: Rewrite to match HTML screen-03**

Key changes:
1. **Header**: "Alerts" (Syne 800 18px) + red "N new" badge (`.badge-new`: danger bg, Space Mono 9px)
2. **Date grouping**: Group alerts into "TODAY" / "YESTERDAY" / "EARLIER" sections using `SectionList` instead of `FlatList`. Section header: Space Mono 9px, `#444444`, letter-spacing 0.18em.
3. **Use rewritten AlertItem** (already handles ACT NOW vs Normal modes)
4. **ActNowCard** triggers as bottom sheet (Task 10)

Date grouping logic:
```typescript
function getDateGroup(sentAt: string): string {
  const date = new Date(sentAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  if (date >= today) return 'TODAY';
  if (date >= yesterday) return 'YESTERDAY';
  return 'EARLIER';
}
```

Remove the custom `header` View (lines 129-136) - use Expo Router's built-in header instead, configured via `_layout.tsx`.

**Step 2: Commit**

```bash
git add "vigil/mobile/app/(tabs)/alerts.tsx"
git commit -m "feat: rewrite Alerts screen with date grouping and HTML mockup styling"
```

---

## Task 14: Rewrite SafeSend Screen

**Files:**
- Modify: `vigil/mobile/app/(tabs)/safesend.tsx`

**Step 1: Rewrite to match HTML screen-05**

Key changes:
1. **Intro section** (`.intro`): "Risk Check" (Syne 800 18px) + "Verify any address before sending funds" (Inter 12px, `#888888`). Bordered bottom.
2. **Form** (`.form`):
   - Recipient address: Space Mono 10px input, `#181818` bg, `#2e2e2e` border
   - Network: `NetworkChips` in row mode (replaces Picker). Horizontal scrollable chips.
   - Amount USD + My Address: side-by-side row (`.frow`)
   - Check button: `#181818` bg, `#242424` border, Syne 800 14px, "Check Risk" (changes to "Checked" after check)
3. **Results** (`.result`):
   - Result card with colored border + shadow based on risk level
   - Header: gradient bg, emoji + "HIGH RISK" (Syne 800 22px) + "Counterparty risk score" + score
   - Body rows: OFAC SANCTIONED, TOKEN BLACKLISTED, DRAINER LINKS, PAYMENT RISK - each as key-value row
   - Reasoning text: Inter 11px, `#888888`, line-height 1.5
   - Verdict bar: full-width colored bg, Syne 800 12px centered text (e.g. "DO NOT SEND -- Sanctioned address")

Remove `@react-native-picker/picker` import. Remove the local `COLORS` object (use theme tokens).

**Step 2: Commit**

```bash
git add "vigil/mobile/app/(tabs)/safesend.tsx"
git commit -m "feat: rewrite SafeSend screen with chip selector and verdict bar"
```

---

## Task 15: Rewrite Wallet Detail Screen

**Files:**
- Modify: `vigil/mobile/app/wallet-detail.tsx`

**Step 1: Rewrite to match HTML screen-02**

Key changes:
1. **Back row**: "< Back" in Space Mono 10px accent color
2. **Detail header** (`.detail-header`):
   - Wallet name (Syne 800 16px) + network badge + risk badge inline
   - Address: Space Mono 9px, `#444444`, word-break
   - Stats grid (`.detail-stats`): 3-column row:
     - BALANCE: value or "N/A" (Space Mono 700 14px) + "BALANCE" label (Space Mono 8px `#444444`)
     - CONTAGION: score colored by risk + "CONTAGION" label
     - LAST TX: relative time + "LAST TX" label
   - Each stat: `#181818` bg, `borderRadius: 10`, `border: 1px solid #242424`, `padding: 10`
3. **Contagion section** (`.csection`):
   - "CONTAGION SCORE" label (Space Mono 9px, `#444444`, letter-spacing 0.18em)
   - Big score (Syne 800 32px, colored) + "/ 10" (Space Mono 11px, `#888888`)
   - Subtitle: "N of M neighbors are high risk"
   - Refresh button: accent-10 bg, accent border, Space Mono 9px "REFRESH" (subtler than solid button)
4. **ContagionGraph** (updated in Task 8)
5. **"RECENT TRANSACTIONS"** section header (Space Mono 9px, `#444444`, letter-spacing 0.18em)
   - Placeholder list or "No transaction data available" if backend doesn't expose this yet
6. **Refresh button**: move from solid accent to subtler `accent-10` bg with accent border
7. **Delete button**: keep as-is (red outlined)

**Step 2: Commit**

```bash
git add vigil/mobile/app/wallet-detail.tsx
git commit -m "feat: rewrite wallet-detail with stats grid matching HTML mockup"
```

---

## Task 16: Cleanup

**Files:**
- Delete: `vigil/mobile/components/EditScreenInfo.tsx`
- Delete: `vigil/mobile/components/Themed.tsx`
- Delete: `vigil/mobile/app/modal.tsx`
- Delete: `vigil/mobile/constants/Colors.ts`
- Modify: `vigil/mobile/app.json` (splash backgroundColor)
- Modify: `vigil/mobile/package.json` (remove `@react-native-picker/picker`)

**Step 1: Remove unused files**

```bash
rm vigil/mobile/components/EditScreenInfo.tsx
rm vigil/mobile/components/Themed.tsx
rm vigil/mobile/app/modal.tsx
rm vigil/mobile/constants/Colors.ts
```

**Step 2: Remove @react-native-picker/picker**

```bash
cd "/Users/josemejia/Documents/Software Development/Range/vigil/mobile" && npm uninstall @react-native-picker/picker
```

**Step 3: Update app.json splash bg**

In `vigil/mobile/app.json`, change splash `backgroundColor` to `"#080808"`.

**Step 4: Verify no import errors**

```bash
cd "/Users/josemejia/Documents/Software Development/Range/vigil/mobile" && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors referencing deleted files.

**Step 5: Remove modal route from _layout.tsx**

In `vigil/mobile/app/_layout.tsx`, remove:
```
<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove unused components, Colors.ts, picker dep, update splash bg"
```

---

## Verification Checklist

After all tasks are complete:

1. `cd vigil/mobile && npx expo start --ios` -- app launches without errors
2. **Wallets tab**: Compare against `screen-01-wallets.html`
   - Section label "WATCHING" with count badge
   - Wallet cards with `#181818` bg, network badge, risk badge, contagion pill with progress bar
   - "Add" button in header (not FAB)
3. **Add Wallet**: Compare against `screen-06-addwallet.html`
   - Bottom sheet with handle bar
   - Network grid (3 columns, colored dots)
   - Side-by-side Label + Email fields
   - "Watch Wallet" green button with shield emoji
4. **Alerts tab**: Compare against `screen-03-alerts.html`
   - Date grouping: TODAY / YESTERDAY / EARLIER
   - ACT NOW banners with gradient, emoji, action previews
   - Normal alerts as compact rows
5. **Act Now**: Compare against `screen-04-actnow.html`
   - Bottom sheet (not full-screen modal)
   - Risk header with 52px emoji box + score bar
   - TX details box with labeled rows
   - Numbered color-coded actions
6. **SafeSend**: Compare against `screen-05-safesend.html`
   - "Risk Check" intro section
   - Network chip row selector
   - Result card with gradient header, detail rows, reasoning, verdict bar
7. **Wallet Detail**: Compare against `screen-02-contagion.html`
   - Stats grid (3 columns: BALANCE, CONTAGION, LAST TX)
   - Contagion graph with updated styling
   - RECENT TRANSACTIONS section
8. **Fonts**: Syne for headlines, Space Mono for technical text, Inter for body text
9. **No TypeScript errors**: `npx tsc --noEmit` passes clean

---

## Implementation Notes

### Data Type Gaps
- `Wallet` type has no `balance` field -- the HTML shows "$12,400". Display "N/A" unless the backend adds this. Could compute from transaction history but that's a separate feature.
- `Alert` type has no explicit `network` or `direction` fields -- parse from `message` string or wallet data.
- Recent transactions on wallet detail: backend `useApi` has no per-wallet transaction endpoint. Show placeholder "No transaction data yet" section.

### Bottom Sheet Setup
- `@gorhom/bottom-sheet` requires `react-native-gesture-handler` + `react-native-reanimated` (both installed)
- The `<GestureHandlerRootView>` wrapper in `_layout.tsx` is critical -- bottom sheets won't work without it
- Use `BottomSheetModal` + `BottomSheetModalProvider` for modal behavior (overlay + dismiss on backdrop tap)
- Import `BottomSheetModalProvider` in `_layout.tsx` and wrap inside GestureHandlerRootView

### Font Names
- When loaded via `useFonts`, use the exact key names in StyleSheet:
  - `fontFamily: 'Syne_800ExtraBold'`
  - `fontFamily: 'Syne_700Bold'`
  - `fontFamily: 'SpaceMono'`
  - `fontFamily: 'Inter_400Regular'`
  - `fontFamily: 'Inter_500Medium'`
  - `fontFamily: 'Inter_600SemiBold'`

### Grid Layout in NetworkChips
- React Native doesn't support CSS `grid-template-columns`. Use `flexWrap: 'wrap'` with calculated widths.
- Each cell width: `(containerWidth - 2 * gap) / 3`. Since padding is 20px each side, container is ~330px, cells ~106px.
- Use percentage width `'31.5%'` as approximation, or calculate from `Dimensions`.
