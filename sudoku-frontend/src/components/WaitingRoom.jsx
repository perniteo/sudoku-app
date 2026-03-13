import React from "react";
import ChatWindow from "./ChatWindow"; // 🎯 공통 컴포넌트 임포트

const WaitingRoom = ({
  roomInfo,
  chatMessages,
  onSendMessage,
  onUpdateDifficulty,
  onCancel,
  onStartGame,
  isHost,
  myId, // 🎯 부모로부터 받은 내 ID 추가 (구분용)
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>MULTIPLAYER WAITING ROOM</h3>
        <div style={styles.codeBox}>
          <span style={styles.label}>참여 코드</span>
          <h1 style={styles.codeText}>{roomInfo.roomCode}</h1>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* 왼쪽: 설정 구역 */}
        <div style={styles.settingsSection}>
          <h4 style={styles.subTitle}>GAME SETTINGS</h4>
          <div style={styles.row}>
            <label>난이도: </label>
            <select
              value={roomInfo.difficulty}
              onChange={(e) => onUpdateDifficulty(Number(e.target.value))}
              disabled={!isHost}
              style={styles.select}
            >
              {[4, 6, 8, 10].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </div>
          <p style={styles.infoText}>
            {isHost
              ? "💡 난이도를 선택하고 친구를 기다리세요."
              : "⏳ 방장이 난이도를 조절 중입니다."}
          </p>

          {isHost && (
            <button onClick={onStartGame} style={styles.startBtn}>
              🎮 GAME START
            </button>
          )}

          <button
            onClick={onCancel}
            style={isHost ? styles.cancelBtnSmall : styles.cancelBtn}
          >
            방 나가기
          </button>
        </div>

        {/* 오른쪽: 공통 채팅 컴포넌트로 교체 ⭐ */}
        <div style={styles.chatSection}>
          <ChatWindow
            messages={chatMessages}
            onSendMessage={onSendMessage}
            myId={myId}
            height="350px"
          />
        </div>
      </div>
    </div>
  );
};

// ... styles에서 기존 chatBox, input, sendBtn 등 중복 스타일은 삭제해도 됨
const styles = {
  // 기존 container, header, mainLayout 등 레이아웃 스타일은 유지
  container: {
    border: "1px solid #ddd",
    padding: "25px",
    borderRadius: "15px",
    backgroundColor: "#fff",
    maxWidth: "800px",
    margin: "0 auto",
  },
  header: { textAlign: "center", marginBottom: "30px" },
  codeBox: {
    backgroundColor: "#f0f4f8",
    padding: "10px",
    borderRadius: "10px",
    display: "inline-block",
  },
  codeText: {
    fontSize: "32px",
    letterSpacing: "5px",
    color: "#673AB7",
    margin: "5px 0",
  },
  mainLayout: {
    display: "flex",
    gap: "30px",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
  },
  settingsSection: { flex: 1, display: "flex", flexDirection: "column" },
  chatSection: { flex: 1.5 }, // ChatWindow가 내부를 다 채움
  subTitle: { fontSize: "12px", color: "#aaa", marginBottom: "15px" },
  startBtn: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    marginTop: "30px",
    width: "100%",
    padding: "10px",
    border: "none",
    backgroundColor: "#ff5252",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cancelBtnSmall: {
    marginTop: "10px",
    width: "100%",
    padding: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#bbb",
    fontSize: "13px",
    textDecoration: "underline",
    cursor: "pointer",
  },
  infoText: {
    fontSize: "13px",
    color: "#666",
    marginTop: "10px",
    lineHeight: "1.4",
  },
  row: { display: "flex", alignItems: "center", gap: "10px" },
  select: { padding: "5px", borderRadius: "4px" },
};

export default WaitingRoom;
