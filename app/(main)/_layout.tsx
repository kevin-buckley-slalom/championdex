import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';

export default function MainTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(pokedex)"
        options={{
          title: 'Pokédex',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="(team)"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => null,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => null,
        }}
      />
    </Tabs>
  );
}
