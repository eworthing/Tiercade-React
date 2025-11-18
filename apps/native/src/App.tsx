import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider } from "react-redux";
import { store } from "@tiercade/state";
import { TierBoardScreen } from "./screens/TierBoardScreen";
import { HeadToHeadScreen } from "./screens/HeadToHeadScreen";
import { ThemesScreen } from "./screens/ThemesScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";

const Stack = createNativeStackNavigator();

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="TierBoard"
            component={TierBoardScreen}
            options={{ title: "Tiercade" }}
          />
          <Stack.Screen
            name="HeadToHead"
            component={HeadToHeadScreen}
            options={{ title: "Head-to-Head" }}
          />
          <Stack.Screen
            name="Themes"
            component={ThemesScreen}
            options={{ title: "Themes" }}
          />
          <Stack.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{ title: "Analytics" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

