import React from "react";
import { TouchableOpacity } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Svg, { Circle, Path } from "react-native-svg";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import SearchScreen from "./screens/SearchScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SeatSelectionScreen from "./screens/SeatSelectionScreen";
import BookingScreen from "./screens/BookingScreen";
import TicketScreen from "./screens/TicketScreen";
import MyTicketsScreen from "./screens/MyTicketsScreen";

const Stack = createNativeStackNavigator();

function SunIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}
function MoonIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Svg>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 14, padding: 4 }}>
      {theme.mode === "light" ? <MoonIcon /> : <SunIcon />}
    </TouchableOpacity>
  );
}

function Navigation() {
  const { theme } = useTheme();

  const navTheme = {
    ...(theme.mode === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.navy,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Search"
        screenOptions={{
          headerStyle: { backgroundColor: theme.navy },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          headerRight: () => <ThemeToggleButton />,
        }}
      >
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: "WakaBus" }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: "Available trips" }} />
        <Stack.Screen
          name="SeatSelection"
          component={SeatSelectionScreen}
          options={{ title: "Choose your seat" }}
        />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Passenger details" }} />
        <Stack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{ title: "Your ticket", headerBackVisible: false }}
        />
        <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: "My tickets" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
