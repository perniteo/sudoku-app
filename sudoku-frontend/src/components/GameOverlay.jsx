import React from "react";

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
}) => {
  // 1. 일시정지 오버레이 (완전 차단 + 세련된 다크그레이)
  if (viewMode === "pause") {
    return (
      <div style={styles.fullOverlay}>
        <div style={styles.pauseBox}>
          <h2 style={{ marginBottom: "20px", color: "#333" }}>PAUSED</h2>
          <div style={styles.btnGroup}>
            <button onClick={togglePause} style={styles.primaryBtn}>
              계속하기
            </button>
            <button
              onClick={() => {
                setGame(null);
                saveAndExit(); // Call the saveAndExit function
                setViewMode("menu");
              }}
              style={styles.secondaryBtn}
            >
              나가기
            </button>
          </div>

          {/* 강제 승리 테스트 버튼 (깔끔하게 하단 배치) */}
          <button
            onClick={() => {
              setGame((prev) => ({ ...prev, status: "COMPLETED" }));
              setViewMode("game"); // 오버레이를 닫기 위해 game으로 변경
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
            {!localStorage.getItem("token") ? (
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
                  onClick={() => setViewMode("SIGNIN")}
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
              }}
              style={styles.primaryBtn}
            >
              난이도 변경
            </button>
            <button
              onClick={() => {
                setGame(null);
                setSeconds(0);
                setViewMode("menu");
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
