import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { HomeScreen } from "../screens/HomeScreen";
import { MapScreen } from "../screens/MapScreen";
import { SignalementScreen } from "../screens/SignalementScreen";
import { DonsScreen } from "../screens/DonsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MaraudesScreen } from "../screens/MaraudesScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { TerrainScreen } from "../screens/TerrainScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Terrain: { maraudeId: string; maraudeTitle: string };
  Maraudes: undefined;
  Classement: undefined;
};

export type TabParamList = {
  Accueil: undefined;
  Carte: undefined;
  Signaler: undefined;
  Donner: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{icon}</Text>;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { paddingBottom: 4, paddingTop: 4, height: 58, borderTopColor: "#f0f0f0" },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Carte"
        component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }}
      />
      <Tab.Screen
        name="Signaler"
        component={SignalementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚠️" focused={focused} /> }}
      />
      <Tab.Screen
        name="Donner"
        component={DonsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💚" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Terrain"
        component={TerrainScreen}
        options={{ presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="Maraudes"
        component={MaraudesScreen}
        options={{
          headerShown: true,
          headerTitle: "🚶 Maraudes",
          headerStyle: { backgroundColor: "#10b981" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="Classement"
        component={LeaderboardScreen}
        options={{
          headerShown: true,
          headerTitle: "🏆 Classement",
          headerStyle: { backgroundColor: "#10b981" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
