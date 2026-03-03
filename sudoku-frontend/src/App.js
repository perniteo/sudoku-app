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

  useEffect(() => {
    console.log("📢 App.js에서 감시중인 myId:", myId);
  }, [myId]); // myId가 바뀔 때마다 실행

  // 인증 모달 상태 (로그인 전용)
  const [showAuth, setShowAuth] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true); // 로그인(true) / 회원가입(false) 전환
  const [game, setGame] = useState(null); // 게임 결과 저장용 (선택사항)

  // --- Render (네 원본 UI & Props 100% 복구) ---
  return (
    <Router>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        {/* 공통 헤더 */}
        <Header
          token={token}
          setToken={setToken} // 🎯 로그아웃 시 토큰 상태 업데이트 위해 setToken 전달
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
              element={
                <Home token={token} anonymousId={anonymousId} myId={myId} />
              }
            />

            {/* 방 목록 (로비) */}
            <Route path="/lobby" element={<Lobby myId={myId} />} />

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
          isLoginView={isLoginView}
          setIsLoginView={setIsLoginView}
          // 🎯 로그인 성공 시 실행될 보상 로직만 깔끔하게 전달
          onLoginSuccess={(newToken, email) => {
            console.log(
              "🎉 로그인 성공! 받은 토큰:",
              newToken,
              "이메일:",
              email,
            );
            setToken(newToken);
            setUser({ email: email });
            setShowAuth(false);
          }}
          game={game} // 게임 결과 화면에서 로그인 유도할 때 필요
        />
      </div>
    </Router>
  );
}
export default App;
