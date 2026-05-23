import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { MapScreen } from "../screens/MapScreen";
import { MaraudesScreen } from "../screens/MaraudesScreen";
import { SignalementScreen } from "../screens/SignalementScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { TerrainScreen } from "../screens/TerrainScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Terrain: { maraudeId: string; maraudeTitle: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#10b981" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { paddingBottom: 8, paddingTop: 4, height: 60 },
      }}
    >
      <Tab.Screen name="Carte" component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} />, title: "Carte" }} />
      <Tab.Screen name="Maraudes" component={MaraudesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🚶" focused={focused} />, title: "Maraudes" }} />
      <Tab.Screen name="Signaler" component={SignalementScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚠️" focused={focused} />, title: "Signaler" }} />
      <Tab.Screen name="Classement" component={LeaderboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏆" focused={focused} />, title: "Classement" }} />
      <Tab.Screen name="Profil" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />, title: "Profil" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Terrain" component={TerrainScreen}
          options={{ presentation: "fullScreenModal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
