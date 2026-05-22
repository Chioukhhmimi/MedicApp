/**
 * Dosely logo — capsule + clock badge on a teal-gradient tile.
 *
 * Ported from `dosely-icon.svg` to react-native-svg so it renders crisply at
 * any size. Use `LogoMark` for the icon alone, or `Logo` for the icon plus
 * "Dosely" wordmark.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Rect,
  Stop,
  Circle,
} from 'react-native-svg';
import { colors } from '@/theme';

interface MarkProps {
  size?: number;
}

export function LogoMark({ size = 48 }: MarkProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient
          id="tile"
          x1="0"
          y1="0"
          x2="512"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#1FB8A6" />
          <Stop offset="1" stopColor="#0E8C82" />
        </LinearGradient>
        <LinearGradient id="capLower" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF8A6B" />
          <Stop offset="1" stopColor="#FF6B5E" />
        </LinearGradient>
        <ClipPath id="capClip">
          <Rect x="146" y="216" width="280" height="118" rx="59" />
        </ClipPath>
      </Defs>

      {/* App tile */}
      <Rect width="512" height="512" rx="116" fill="url(#tile)" />
      <Circle cx="150" cy="140" r="220" fill="#FFFFFF" opacity={0.06} />

      {/* Capsule, rotated -45deg around its center */}
      <G transform="translate(-14 -10) rotate(-45 286 275)">
        <Rect x="146" y="216" width="280" height="118" rx="59" fill="#FFFFFF" />
        <G clipPath="url(#capClip)">
          <Rect
            x="286"
            y="216"
            width="140"
            height="118"
            fill="url(#capLower)"
          />
        </G>
        <Rect
          x="282"
          y="216"
          width="8"
          height="118"
          fill="#0E8C82"
          opacity={0.16}
        />
        <Rect
          x="170"
          y="232"
          width="120"
          height="20"
          rx="10"
          fill="#FFFFFF"
          opacity={0.7}
        />
      </G>

      {/* Reminder clock badge (top-right of capsule) */}
      <G transform="translate(334 140)">
        <Circle r="62" fill="#0B5A54" />
        <Circle r="50" fill="#FFFFFF" />
        <Rect x="-4" y="-30" width="8" height="34" rx="4" fill="#0E8C82" />
        <Rect x="-26" y="-4" width="30" height="8" rx="4" fill="#FF6B5E" />
        <Circle r="6" fill="#0E8C82" />
      </G>
    </Svg>
  );
}

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function Logo({
  size = 40,
  showWordmark = true,
}: LogoProps): React.JSX.Element {
  if (!showWordmark) return <LogoMark size={size} />;
  return (
    <View
      style={styles.row}
      accessibilityRole="header"
      accessibilityLabel="Dosely"
    >
      <LogoMark size={size} />
      <Text style={[styles.wordmark, { fontSize: size * 0.6 }]}>
        Dose<Text style={styles.wordmarkAccent}>ly</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontWeight: '800',
    color: colors.brandInk,
    letterSpacing: -0.8,
  },
  wordmarkAccent: { color: colors.primary },
});
