import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login/Login.tsx";
import Cadastro from "./pages/Cadastro/Cadastro.tsx";
import Questionario from "./pages/Questionario/Questionario.tsx";
import Resultado from "./pages/Resultado/Resultado.tsx";
import Home from "./pages/Home/Home.tsx";

import Header from "./components/Header/Header.tsx";

const isAuthenticated = () => !!localStorage.getItem("token");

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  return isAuthenticated() ? <Navigate to="/inicio" replace /> : children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Rota Raiz */}
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

        {/* ROTAS PÚBLICAS */}
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

        {/* ROTAS PRIVADAS */}
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
