import React from "react";
import { useNavigate } from "react-router-dom"; // 🎯 추가
import { useState } from "react"; // 🎯 추가

const GameOverlay = ({
  game,
  viewMode,
  setViewMode,
  setGame,
  setSeconds,
  formatTime,
  seconds,
  startGame,
  togglePause,
  saveAndExit,
  gameId,
  setShowAuthModal, // 🎯 로그인 모달 제어 함수
  setIsLoginView, // 🎯 로그인/회원가입 전환 상태 제어 함수
}) => {
  const navigate = useNavigate(); // 🎯 선언
  const isMulti = gameId?.startsWith("multi:");
  const canSurrender = seconds >= 180; // 3분 기준

  // 1. 일시정지 오버레이 (완전 차단 + 세련된 다크그레이)
  if (viewMode === "pause") {
    return (
      <div style={styles.fullOverlay}>
        <div style={styles.pauseBox}>
          {/* 🎯 멀티는 OPTIONS, 싱글은 PAUSED */}
          <h2 style={{ marginBottom: "20px", color: "#333" }}>
            {isMulti ? "GAME OPTIONS" : "PAUSED"}
          </h2>

          <div style={styles.btnGroup}>
            <button onClick={togglePause} style={styles.primaryBtn}>
              계속하기
            </button>

            {/* 🎯 멀티플레이 전용: 탈주 vs 항복 */}
            <button
              onClick={() => {
                if (isMulti && !canSurrender) {
                  if (
                    !window.confirm(
                      "🚨 아직 3분이 지나지 않았습니다! 지금 나가면 탈주 페널티가 부여됩니다. 정말 나갈까요?",
                    )
                  )
                    return;
                }
                saveAndExit(seconds);
                setGame(null);
                navigate("/"); // 🎯 메인 메뉴로 이동
              }}
              style={
                isMulti && !canSurrender
                  ? styles.dangerBtn
                  : styles.secondaryBtn
              }
            >
              {isMulti
                ? canSurrender
                  ? "🏳️ 항복하고 나가기"
                  : "🏃 탈주하기"
                : "저장 후 나가기"}
            </button>
          </div>

          <button
            onClick={() => {
              setGame((prev) => ({ ...prev, status: "COMPLETED" }));
              setViewMode("game");
            }}
            style={styles.cheatBtn}
          >
            DEBUG: 강제 승리 🏆
          </button>
        </div>
      </div>
    );
  }

  // 2. 미션 완료 오버레이 (정답 화면)
  if (game?.status === "COMPLETED") {
    return (
      <div
        style={{
          ...styles.fullOverlay,
          backgroundColor: "rgba(255, 255, 255, 0.98)",
        }}
      >
        <div style={styles.successBox}>
          <span style={{ fontSize: "50px" }}>🎉</span>
          <h2 style={{ color: "#2e7d32", margin: "10px 0" }}>
            MISSION COMPLETE!
          </h2>

          <div style={styles.recordBox}>
            <p style={{ fontSize: "18px", marginBottom: "10px" }}>
              <strong>난이도</strong> {game.difficulty} 단계 |{" "}
              <strong>기록</strong> {formatTime(seconds)}
            </p>

            {/* ★ 로그인 유도 섹션 추가 ★ */}
            {!localStorage.getItem("accessToken") ? (
              <div style={styles.loginPromote}>
                <p
                  style={{
                    color: "#d32f2f",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "5px",
                  }}
                >
                  ⚠️ 현재 비로그인 상태입니다.
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  지금 로그인하면 이 기록을 랭킹에 등록할 수 있습니다!
                </p>
                <button
                  onClick={() => {
                    setIsLoginView(true); // 로그인 모드로 초기화
                    setShowAuthModal(true); // 모달 띄우기
                  }}
                  style={styles.loginSaveBtn}
                >
                  로그인하고 기록 저장하기
                </button>
              </div>
            ) : (
              <p
                style={{
                  color: "#2e7d32",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                ✅ 기록이 서버에 안전하게 저장되었습니다!
              </p>
            )}
          </div>

          <div style={styles.btnGroup}>
            <button onClick={startGame} style={styles.successBtn}>
              다시 하기
            </button>
            <button
              onClick={() => {
                setGame(null);
                setViewMode("menu");
                navigate("/"); // 🎯 메인 메뉴로 이동
              }}
              style={styles.primaryBtn}
            >
              난이도 변경
            </button>
            <button
              onClick={() => {
                setGame(null);
                setSeconds(0);
                navigate("/"); // 🎯 메인 메뉴로 이동
              }}
              style={styles.dangerBtn}
            >
              종료
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (game?.status === "FAILED") {
    return (
      <div
        style={{ ...styles.fullOverlay, backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      >
        <div
          style={{
            ...styles.successBox,
            borderColor: "#f44336",
            backgroundColor: "#fff",
          }}
        >
          <span style={{ fontSize: "50px" }}>💀</span>
          <h2 style={{ color: "#d32f2f", margin: "10px 0" }}>GAME OVER</h2>
          <p>목숨을 모두 잃었습니다!</p>
          <div style={styles.btnGroup}>
            <button onClick={startGame} style={styles.dangerBtn}>
              재도전하기
            </button>
            <button onClick={() => navigate("/")} style={styles.secondaryBtn}>
              메인메뉴로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// --- 디자인 스타일 (CSS-in-JS) ---
const styles = {
  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    borderRadius: "8px",
    border: "2px solid #333",
  },
  pauseBox: { textAlign: "center", padding: "20px" },
  successBox: {
    textAlign: "center",
    padding: "30px",
    border: "3px solid #4CAF50",
    borderRadius: "15px",
    backgroundColor: "#f9fff9",
  },
  recordBox: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "10px",
    margin: "20px 0",
    boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
  },
  btnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  primaryBtn: {
    width: "160px",
    padding: "12px",
    cursor: "pointer",
    backgroundColor: "#2196F3",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  secondaryBtn: {
    width: "160px",
    padding: "12px",
    cursor: "pointer",
    backgroundColor: "#9e9e9e",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  },
  successBtn: {
    width: "160px",
    padding: "12px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  dangerBtn: {
    width: "160px",
    padding: "12px",
    cursor: "pointer",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
  },
  cheatBtn: {
    marginTop: "30px",
    padding: "5px 10px",
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "10px",
    border: "none",
    cursor: "pointer",
    opacity: 0.5,
  },
  loginPromote: {
    marginTop: "10px",
    padding: "15px",
    backgroundColor: "#fff9c4", // 강조를 위한 노란색 배경
    borderRadius: "10px",
    border: "1px dashed #fbc02d",
  },
  loginSaveBtn: {
    padding: "10px 20px",
    backgroundColor: "#e91e63", // 시선을 끄는 핑크색
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },
};

export default GameOverlay;
