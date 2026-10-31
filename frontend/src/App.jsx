import React from "react";
import { Provider } from "react-redux";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import store from "./redux/store";
import Routing from "./router";
import { Layout } from "./components";
import "./style/index.css";
import "./style/responsive.css";
import { BrowserRouter } from "react-router-dom";
function App() {
  const theme = createTheme({
    typography: {
      fontFamily: ["Roboto"].join(","),
    },
    palette: {
      mode: "light",
      primary: {
        main: "#0b0e12",
        light: "#b4b8ac",
        dark: "#296192",
        contrastText: "#fff",
      },
      text: {
        primary: "rgba(0, 0, 0, 0.87)",
        secondary: "rgba(0, 0, 0, 0.6)",
        disabled: "rgba(0, 0, 0, 0.38)",
      },
    },
  });

  const persistor = persistStore(store);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Layout>
              <Routing />
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
