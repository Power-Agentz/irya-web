import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/Login/Login.tsx";
import Cadastro from "./pages/Cadastro/Cadastro.tsx";
import Questionario from "./pages/Questionario/Questionario.tsx";
import Resultado from "./pages/Resultado/Resultado.tsx";
import Home from "./pages/Home/Home.tsx";
import Admin from "./pages/Admin/Admin.tsx";
import Assinatura from "./pages/Assinatura/Assinatura.tsx";

import Header from "./components/Header/Header.tsx";
import LoggedFooter from "./components/LoggedFooter/LoggedFooter.tsx";
import { AUTH_CHANGE_EVENT, isAuthenticated } from "./utils/session";

const PrivateRoute: React.FC<{ children: React.ReactElement; authenticated: boolean }> = ({
  children,
  authenticated,
}) => {
  return authenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactElement; authenticated: boolean }> = ({
  children,
  authenticated,
}) => {
  return authenticated ? <Navigate to="/inicio" replace /> : children;
};

const AppShell: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showLoggedFooter = authenticated && !isAdminRoute;

  useEffect(() => {
    const syncAuth = () => setAuthenticated(isAuthenticated());

    window.addEventListener("storage", syncAuth);
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
    };
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {!isAdminRoute && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-16 h-72 w-72 rounded-full bg-[#9bad8f]/30 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#c9b181]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#768a6a]/25 blur-3xl" />
        </div>
      )}

      {!isAdminRoute && <Header />}

      <div className="flex flex-1 items-stretch py-0">
        <Routes>
          <Route
            path="/"
            element={
              authenticated ? (
                <Navigate to="/inicio" replace />
              ) : (
                <Navigate to="/cadastro" replace />
              )
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute authenticated={authenticated}>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/cadastro"
            element={
              <PublicRoute authenticated={authenticated}>
                <Cadastro />
              </PublicRoute>
            }
          />

          <Route
            path="/inicio"
            element={
              <PrivateRoute authenticated={authenticated}>
                <Home />
              </PrivateRoute>
            }
          />

          <Route
            path="/questionario"
            element={
              <PrivateRoute authenticated={authenticated}>
                <Questionario />
              </PrivateRoute>
            }
          />

          <Route
            path="/resultado"
            element={
              <PrivateRoute authenticated={authenticated}>
                <Resultado />
              </PrivateRoute>
            }
          />

          <Route
            path="/assinatura"
            element={
              <PrivateRoute authenticated={authenticated}>
                <Assinatura />
              </PrivateRoute>
            }
          />

          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {showLoggedFooter && <LoggedFooter />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppShell />
    </Router>
  );
};

export default App;
