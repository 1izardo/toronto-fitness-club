import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import { NotificationsProvider } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { AuthProvider, RequireAuth } from "react-auth-kit";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import Profile from "./pages/Accounts/Profile";
import Login from "./pages/Accounts/Login";
import Logout from "./pages/Accounts/Logout";
import Register from "./pages/Accounts/Register";
import ClassDetails from "./pages/Classes/ClassDetails";
import Home from "./pages/Home/Home";
import Map from "./pages/Map/Map";
import StudioDetails from "./pages/Studios/StudioDetails";
import Subscriptions from "./pages/Subscriptions/Subscriptions";
import SearchClasses from "./pages/Search/SearchClasses";
import SearchStudios from "./pages/Search/SearchStudios";
import Payments from "./pages/Payments/Payments";

function App() {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] =
    useState<ColorScheme>(preferredColorScheme);
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  useEffect(() => {
    setColorScheme(preferredColorScheme);
  }, [preferredColorScheme]);

  return (
    <AuthProvider
      authType={"cookie"}
      authName={"_auth"}
      cookieDomain={window.location.hostname}
      cookieSecure={window.location.protocol === "https:"}
    >
      <BrowserRouter>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
              primaryColor: "orange",
              colorScheme,
            }}
          >
            <NotificationsProvider>
              <Routes>
                <Route
                  element={
                    <RequireAuth loginPath="/login">
                      <Shell />
                    </RequireAuth>
                  }
                >
                  <Route path="/" element={<Home />} />
                  <Route path="/browse" element={<Map />} />
                  <Route
                    path="/studio/:studio_id"
                    element={<StudioDetails />}
                  />
                  <Route
                    path="/studio/:studio_id/class/:class_id"
                    element={<ClassDetails />}
                  />
                  <Route path="/search" element={<SearchStudios />} />
                  <Route
                    path="/search/:studio_id"
                    element={<SearchClasses />}
                  />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Route>

                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
              </Routes>
            </NotificationsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
