/** Tab navigator — Home, Medications, History, Settings. */
import React from 'react';
import { Tabs } from 'expo-router';
import {
  ChartBarLineIcon,
  Home01Icon,
  Medicine02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { colors } from '@/theme';

function TabIcon({
  icon,
  color,
  focused,
}: {
  icon: IconSvgElement;
  color: string;
  focused: boolean;
}): React.JSX.Element {
  return (
    <Icon icon={icon} size={24} color={color} strokeWidth={focused ? 2 : 1.5} />
  );
}

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home01Icon} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Medications',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Medicine02Icon} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ChartBarLineIcon} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Settings02Icon} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
