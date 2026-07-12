/** Tab navigator — Home, Medications, History, Settings. */
import React from 'react';
import { Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChartBarLineIcon,
  Home01Icon,
  Medicine02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { colors, radius, shadow, textCaps } from '@/theme';

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
    <Icon
      icon={icon}
      size={24}
      color={color}
      strokeWidth={focused ? 2.25 : 1.5}
    />
  );
}

function TabLabel({
  label,
  color,
}: {
  label: string;
  color: string;
}): React.JSX.Element {
  // Cap font scaling so accessibility text sizes can't break the tab bar.
  return (
    <Text
      {...textCaps.chrome}
      numberOfLines={1}
      style={{ fontSize: 11, fontWeight: '700', color }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout(): React.JSX.Element {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          height: (Platform.OS === 'ios' ? 50 : 50) + bottom,
          paddingBottom: bottom,
          paddingTop: 6,
          ...shadow,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Home01Icon} color={color} focused={focused} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label={t('tabs.today')} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: t('tabs.medications'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Medicine02Icon} color={color} focused={focused} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label={t('tabs.medications')} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ChartBarLineIcon} color={color} focused={focused} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label={t('tabs.history')} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Settings02Icon} color={color} focused={focused} />
          ),
          tabBarLabel: ({ color }) => (
            <TabLabel label={t('tabs.settings')} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
