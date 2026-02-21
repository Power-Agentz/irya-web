import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login.tsx";
import Cadastro from "./pages/Cadastro/Cadastro.tsx";
import Questionario from "./pages/Questionario/Questionario.tsx";
import Resultado from "./pages/Resultado/Resultado.tsx";
import Home from "./pages/Home/Home.tsx";

import Header from "./components/Header/Header.tsx";
import { isAuthenticated } from "./utils/session";

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/inicio" replace /> : children;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="relative flex min-h-dvh flex-col overflow-x-clip">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-16 h-72 w-72 rounded-full bg-[#9bad8f]/30 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#c9b181]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#768a6a]/25 blur-3xl" />
        </div>

        <Header />

        <div className="flex flex-1 items-stretch md:items-center md:py-8">
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated() ? (
                  <Navigate to="/inicio" replace />
                ) : (
                  <Navigate to="/cadastro" replace />
                )
              }
            />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/cadastro"
              element={
                <PublicRoute>
                  <Cadastro />
                </PublicRoute>
              }
            />

            <Route
              path="/inicio"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/questionario"
              element={
                <PrivateRoute>
                  <Questionario />
                </PrivateRoute>
              }
            />

            <Route
              path="/resultado"
              element={
                <PrivateRoute>
                  <Resultado />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
