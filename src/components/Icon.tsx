/**
 * Icon — thin wrapper around HugeiconsIcon.
 *
 * The rest of the app imports `Icon` from here rather than from the library
 * directly, so the default size/stroke/color and the underlying icon library
 * can be tuned in one place.
 */
import React from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import { colors } from '@/theme';

interface Props {
  icon: IconSvgElement;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  icon,
  size = 22,
  color = colors.text,
  strokeWidth = 1.75,
}: Props): React.JSX.Element {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}

export type { IconSvgElement };
