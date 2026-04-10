// components/ContagionGraph.tsx
// ─────────────────────────────────────────────────────────────────────────────
// SVG-based contagion graph. Root wallet in center, counterparties arranged
// in a circle around it, color-coded by risk level.
//
// The SVG math is pre-solved here so Claude Code doesn't have to calculate it.
// Uses react-native-svg. Install: npx expo install react-native-svg
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line, Text as SvgText, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ContagionNode {
  address: string;
  network: string;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  riskScore: number;
  label: string | null;
  transferCount: number;
}

interface ContagionGraphProps {
  nodes: ContagionNode[];
  contagionScore: number;
  rootAddress: string;
  onNodePress?: (node: ContagionNode) => void;
}

// ── Risk Colors ───────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  VERY_LOW: '#3DFFA0',
  LOW:      '#3DFFA0',
  MEDIUM:   '#F5A623',
  HIGH:     '#FF3B30',
  CRITICAL: '#FF2D55',
  UNKNOWN:  '#888888',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ContagionGraph({
  nodes,
  contagionScore,
  rootAddress,
  onNodePress,
}: ContagionGraphProps) {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<ContagionNode | null>(null);

  const WIDTH  = Dimensions.get('window').width - 36; // 18px padding each side
  const HEIGHT = 220;
  const CX     = WIDTH / 2;
  const CY     = HEIGHT / 2;

  // ── Layout math: place nodes in a circle ──────────────────────────────────
  // Radius of the circle on which counterparty nodes sit
  const ORBIT_RADIUS = Math.min(CX, CY) - 28;

  const layoutNodes = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2; // start at top
    return {
      ...node,
      x: CX + ORBIT_RADIUS * Math.cos(angle),
      y: CY + ORBIT_RADIUS * Math.sin(angle),
    };
  });

  // Node size scales slightly with transfer count (relative weight)
  const maxTransfers = Math.max(...nodes.map(n => n.transferCount), 1);
  function nodeRadius(transferCount: number): number {
    const base = 7;
    const scale = transferCount / maxTransfers;
    return base + scale * 5; // 7–12px range
  }

  const truncateAddress = (addr: string) =>
    addr.length > 10 ? addr.slice(0, 5) + '...' + addr.slice(-3) : addr;

  return (
    <View style={styles.container}>
      {/* ── SVG Graph ────────────────────────────────────────────────────── */}
      <View style={[styles.graphWrap, { width: WIDTH, height: HEIGHT }]}>
        <Svg width={WIDTH} height={HEIGHT}>
          <Defs>
            <RadialGradient id="rootGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"   stopColor="#3DFFA0" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#3DFFA0" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Ambient glow around root */}
          <Ellipse
            cx={CX} cy={CY}
            rx={ORBIT_RADIUS * 0.5}
            ry={ORBIT_RADIUS * 0.5}
            fill="url(#rootGlow)"
          />

          {/* ── Edges: root → each counterparty ── */}
          {layoutNodes.map((node, i) => {
            const color = RISK_COLORS[node.riskLevel];
            const isRisky = ['HIGH', 'CRITICAL'].includes(node.riskLevel);
            return (
              <Line
                key={`edge-${i}`}
                x1={CX} y1={CY}
                x2={node.x} y2={node.y}
                stroke={color}
                strokeWidth={isRisky ? 1.5 : 0.8}
                strokeOpacity={isRisky ? 0.5 : 0.2}
                strokeDasharray={isRisky ? undefined : '4,4'}
              />
            );
          })}

          {/* ── Counterparty nodes ── */}
          {layoutNodes.map((node, i) => {
            const color = RISK_COLORS[node.riskLevel];
            const r     = nodeRadius(node.transferCount);
            const isSelected = selectedNode?.address === node.address;
            const isRisky = ['HIGH', 'CRITICAL'].includes(node.riskLevel);

            return (
              <G key={`node-${i}`} onPress={() => {
                const newSel = isSelected ? null : node;
                setSelectedNode(newSel);
                if (newSel) onNodePress?.(newSel);
              }}>
                {/* Outer glow for risky nodes */}
                {isRisky && (
                  <Circle
                    cx={node.x} cy={node.y}
                    r={r + 5}
                    fill={color + '12'}
                    stroke={color}
                    strokeWidth={0.5}
                    strokeOpacity={0.3}
                  />
                )}
                {/* Main node circle */}
                <Circle
                  cx={node.x} cy={node.y}
                  r={r}
                  fill={color + '20'}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeOpacity={isSelected ? 1 : 0.8}
                />
                {/* Risk indicator: show ! for high/critical */}
                {isRisky && (
                  <SvgText
                    x={node.x} y={node.y + 3}
                    textAnchor="middle"
                    fontSize={9} fontFamily="Space Mono"
                    fontWeight="700"
                    fill={color}
                  >!</SvgText>
                )}
              </G>
            );
          })}

          {/* ── Root node (YOU) ── */}
          {/* Outer ring */}
          <Circle
            cx={CX} cy={CY} r={20}
            fill="#3DFFA018"
            stroke="#3DFFA0"
            strokeWidth={2.5}
          />
          {/* Inner circle */}
          <Circle
            cx={CX} cy={CY} r={12}
            fill="#0a0a0a"
            stroke="#3DFFA0"
            strokeWidth={1.5}
          />
          {/* YOU label */}
          <SvgText
            x={CX} y={CY + 4}
            textAnchor="middle"
            fontSize={8} fontFamily="Space Mono"
            fontWeight="700"
            fill="#3DFFA0"
          >YOU</SvgText>

          {/* ── Legend (bottom left) ── */}
          {[
            { label: 'SAFE',   color: '#3DFFA0', x: 14 },
            { label: 'MEDIUM', color: '#F5A623', x: 60 },
            { label: 'HIGH',   color: '#FF3B30', x: 118 },
          ].map(item => (
            <G key={item.label}>
              <Circle cx={item.x + 5} cy={HEIGHT - 10} r={4}
                fill={item.color + '20'} stroke={item.color} strokeWidth={1} />
              <SvgText x={item.x + 13} y={HEIGHT - 6}
                fontSize={7} fontFamily="Space Mono"
                fill="#555" letterSpacing={0.5}>
                {item.label}
              </SvgText>
            </G>
          ))}

        </Svg>
      </View>

      {/* ── Selected node tooltip ─────────────────────────────────────────── */}
      {selectedNode && (
        <View style={[
          styles.tooltip,
          { borderColor: RISK_COLORS[selectedNode.riskLevel] + '40' }
        ]}>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>ADDRESS</Text>
            <Text style={styles.tooltipValue}>
              {truncateAddress(selectedNode.address)}
            </Text>
          </View>
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>RISK</Text>
            <Text style={[styles.tooltipValue, { color: RISK_COLORS[selectedNode.riskLevel] }]}>
              {selectedNode.riskLevel} ({selectedNode.riskScore.toFixed(1)}/10)
            </Text>
          </View>
          {selectedNode.label && (
            <View style={styles.tooltipRow}>
              <Text style={styles.tooltipLabel}>ENTITY</Text>
              <Text style={styles.tooltipValue}>{selectedNode.label}</Text>
            </View>
          )}
          <View style={styles.tooltipRow}>
            <Text style={styles.tooltipLabel}>TRANSFERS</Text>
            <Text style={styles.tooltipValue}>{selectedNode.transferCount}</Text>
          </View>
          <TouchableOpacity
            style={styles.tooltipCTA}
            onPress={() => {
              if (selectedNode) {
                setSelectedNode(null);
                router.push(`/(tabs)/safesend?address=${selectedNode.address}&network=${selectedNode.network}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.tooltipCTAText}>Check in SafeSend →</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  graphWrap: {
    backgroundColor: '#181818',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242424',
    height: 180,
  },
  tooltip: {
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#181818',
    padding: 12,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  tooltipLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#999',
    letterSpacing: 0.8,
  },
  tooltipValue: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  tooltipCTA: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(61,255,160,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(61,255,160,0.2)',
    alignItems: 'center',
  },
  tooltipCTAText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#3DFFA0',
    letterSpacing: 0.5,
  },
});
