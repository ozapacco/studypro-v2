import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, RegisterScreen, ReviewScreen, StatsScreen, OnboardingScreen } from '../screens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Home: '🏠',
    Registrar: '✏️',
    Revisar: '🔄',
    Stats: '📊',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icons[name]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{name}</Text>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Registrar" component={RegisterScreen} />
      <Tab.Screen name="Revisar" component={ReviewScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return (
      <View style={styles.onboardingContainer}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F172A',
    borderTopColor: '#1E293B',
    borderTopWidth: 1,
    height: 80,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: '#3B82F6',
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});