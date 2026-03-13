import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import GamePage from "./pages/GamePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import Lobby from "./pages/Lobby";
import RecordsPage from "./pages/RecordsPage"; // 🎯 추가

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || null,
  );
  const [user, setUser] = useState(null);
  const [anonymousId] = useState(() => {
    const saved = localStorage.getItem("sudoku_anon_id");
    if (saved) return saved;
    const newId = `anon:${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("sudoku_anon_id", newId);
    return newId;
  });

  const myId = useMemo(
    () => (token && user?.email ? `user:${user.email}` : anonymousId),
    [token, user, anonymousId],
  );

  const [showAuth, setShowAuth] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [game, setGame] = useState(null);

  //
  useEffect(() => {
    const handleAuthUpdate = (e) => {
      const { token: newToken, user: userData } = e.detail;
      setToken(newToken);
      setUser(userData); // 🎯 여기서 닉네임이 복구됨!
    };

    const handleLogout = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
    };

    window.addEventListener("auth_update", handleAuthUpdate);
    window.addEventListener("auth_logout", handleLogout);
    return () => {
      window.removeEventListener("auth_update", handleAuthUpdate);
      window.removeEventListener("auth_logout", handleLogout);
    };
  }, []);

  return (
    <Router>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <Header
          token={token}
          setToken={setToken}
          onLoginClick={() => setShowAuth(true)}
          // 🎯 Header 내부로 로그아웃 서비스 로직을 옮겼다면 이 prop은 안 써도 됨
          onLogout={() => {
            setToken(null);
            setUser(null);
            localStorage.removeItem("accessToken");
          }}
        />

        <main style={{ marginTop: "20px" }}>
          <Routes>
            <Route
              path="/"
              element={
                <Home token={token} anonymousId={anonymousId} myId={myId} />
              }
            />
            <Route path="/lobby" element={<Lobby myId={myId} />} />
            <Route
              path="/waiting/:roomCode"
              element={
                <WaitingRoomPage myId={myId} token={token} user={user} />
              }
            />
            <Route
              path="/game/:gameId"
              element={<GamePage myId={myId} token={token} user={user} />}
            />

            {/* 🎯 1. 기록실 전용 경로 추가 */}
            <Route path="/records" element={<RecordsPage />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <AuthModal
          show={showAuth}
          onClose={() => setShowAuth(false)}
          isLoginView={isLoginView}
          setIsLoginView={setIsLoginView}
          onLoginSuccess={(newToken, userData) => {
            setToken(newToken);
            setUser(userData);
            setShowAuth(false);
          }}
          game={game}
        />
      </div>
    </Router>
  );
}

export default App;
