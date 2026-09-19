import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SearchScreen from "./screens/SearchScreen";
import ResultsScreen from "./screens/ResultsScreen";
import SeatSelectionScreen from "./screens/SeatSelectionScreen";
import BookingScreen from "./screens/BookingScreen";
import TicketScreen from "./screens/TicketScreen";
import MyTicketsScreen from "./screens/MyTicketsScreen";

const Stack = createNativeStackNavigator();

const NAVY = "#0B2E8A";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Search"
        screenOptions={{
          headerStyle: { backgroundColor: NAVY },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
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
