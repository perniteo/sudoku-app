import React, { useState, useMemo } from "react";
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

function App() {
  // 1. 전역 공통 상태만 남깁니다. (로그인, 익명ID)
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

  // 인증 모달 상태 (로그인 전용)
  const [showAuth, setShowAuth] = useState(false);

  // --- Render (네 원본 UI & Props 100% 복구) ---
  return (
    <Router>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        {/* 공통 헤더 */}
        <Header
          token={token}
          onLoginClick={() => setShowAuth(true)}
          onLogout={() => {
            setToken(null);
            setUser(null);
            localStorage.removeItem("accessToken");
          }}
        />

        <main style={{ marginTop: "20px" }}>
          <Routes>
            {/* 메인 메뉴 (싱글 시작/이어하기 등) */}
            <Route
              path="/"
              element={<Home token={token} anonymousId={anonymousId} />}
            />

            {/* 방 목록 (로비) */}
            <Route path="/lobby" element={<Lobby />} />

            {/* 멀티 대기실 */}
            <Route
              path="/waiting/:roomCode"
              element={<WaitingRoomPage myId={myId} />}
            />

            {/* 실제 게임 화면 (주소창에 gameId가 박힘) */}
            <Route
              path="/game/:gameId"
              element={<GamePage myId={myId} token={token} />}
            />

            {/* 잘못된 경로는 홈으로 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <AuthModal
          show={showAuth}
          onClose={() => setShowAuth(false)}
          setToken={setToken}
          setUser={setUser}
        />
      </div>
    </Router>
  );
}
export default App;
