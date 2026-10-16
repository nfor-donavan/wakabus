import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Svg, { Circle, Path } from "react-native-svg";

import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import BrandPreloader from "./components/BrandPreloader";
import SearchScreen from "./screens/SearchScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SeatSelectionScreen from "./screens/SeatSelectionScreen";
import BookingScreen from "./screens/BookingScreen";
import TicketScreen from "./screens/TicketScreen";
import MyTicketsScreen from "./screens/MyTicketsScreen";
import StaffLoginScreen from "./screens/StaffLoginScreen";
import StaffScannerScreen from "./screens/StaffScannerScreen";

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

// Header controls shown on every screen: language switch + dark/light switch.
function HeaderControls() {
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLang } = useLanguage();
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity onPress={toggleLang} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{t("common.langToggle")}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 10, padding: 4 }}>
        {theme.mode === "light" ? <MoonIcon /> : <SunIcon />}
      </TouchableOpacity>
    </View>
  );
}

function Navigation() {
  const { theme } = useTheme();
  const { t } = useLanguage();

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
          headerRight: () => <HeaderControls />,
        }}
      >
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: t("nav.search") }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: t("nav.results") }} />
        <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} options={{ title: t("nav.seat") }} />
        <Stack.Screen name="Booking" component={BookingScreen} options={{ title: t("nav.booking") }} />
        <Stack.Screen
          name="Ticket"
          component={TicketScreen}
          options={{ title: t("nav.ticket"), headerBackVisible: false }}
        />
        <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: t("nav.myTickets") }} />
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} options={{ title: t("nav.staffLogin") }} />
        <Stack.Screen
          name="StaffScanner"
          component={StaffScannerScreen}
          options={{ title: t("nav.scanner"), headerBackVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// The native splash (app.json) hands over to this branded preloader while the
// saved theme + language load. A short minimum display time keeps the hand-over
// from flashing past.
function Root() {
  const { ready: themeReady } = useTheme();
  const { ready: langReady, t } = useLanguage();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), 800);
    return () => clearTimeout(id);
  }, []);

  if (!themeReady || !langReady || !minElapsed) {
    return <BrandPreloader text={t("brand.initializing")} />;
  }
  return <Navigation />;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Root />
      </LanguageProvider>
    </ThemeProvider>
  );
}
