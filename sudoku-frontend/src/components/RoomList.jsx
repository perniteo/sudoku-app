import React from "react";

const RoomList = ({ rooms, onJoin, onBack }) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>PUBLIC ROOMS</h3>
      <div style={styles.list}>
        {rooms.length === 0 ? (
          <p style={styles.emptyText}>현재 생성된 방이 없습니다.</p>
        ) : (
          rooms.map((room) => (
            <div key={room.roomCode} style={styles.roomItem}>
              <div style={styles.roomInfo}>
                <span style={styles.badge}>Lv.{room.difficulty}</span>
                <span style={styles.codeText}>{room.roomCode}</span>
                <span style={styles.playerCount}>
                  👤 {room.currentPlayers}/2
                </span>
              </div>
              <button
                onClick={() => onJoin(room.roomCode)}
                disabled={room.currentPlayers >= 2}
                style={
                  room.currentPlayers >= 2 ? styles.fullBtn : styles.joinBtn
                }
              >
                {room.currentPlayers >= 2 ? "FULL" : "참가"}
              </button>
            </div>
          ))
        )}
      </div>
      <button onClick={onBack} style={styles.backBtn}>
        뒤로 가기
      </button>
    </div>
  );
};

const styles = {
  container: {
    border: "1px solid #ddd",
    padding: "25px",
    borderRadius: "15px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    margin: "0 auto",
  },
  title: {
    fontSize: "12px",
    color: "#888",
    letterSpacing: "1.5px",
    marginBottom: "20px",
    fontWeight: "bold",
    textAlign: "center",
  },
  list: {
    maxHeight: "350px",
    overflowY: "auto",
    marginBottom: "20px",
    paddingRight: "5px",
  },
  roomItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 10px",
    borderBottom: "1px solid #f5f5f5",
    transition: "background-color 0.2s",
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    backgroundColor: "#E3F2FD",
    color: "#2196F3",
    padding: "4px 8px",
    borderRadius: "5px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  codeText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
    letterSpacing: "1px",
  },
  playerCount: {
    fontSize: "13px",
    color: "#999",
  },
  joinBtn: {
    padding: "6px 15px",
    backgroundColor: "#2196F3",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  fullBtn: {
    padding: "6px 15px",
    backgroundColor: "#eee",
    color: "#aaa",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
    fontSize: "13px",
    fontWeight: "bold",
  },
  backBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#f5f5f5",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#bbb",
    padding: "40px 0",
    fontSize: "14px",
  },
};

export default RoomList;
