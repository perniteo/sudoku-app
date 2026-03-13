import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecordService } from "../services/RecordService";

const RecordsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ records: [], summary: null });
  const [loading, setLoading] = useState(true);

  // 🎯 1. 페이지 진입 시 데이터 로드
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const resData = await RecordService.fetchAllRecords();
        setData({
          records: resData.records || [],
          summary: resData.summary || null,
        });
      } catch (err) {
        console.error("기록 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // 🎯 2. 날짜 및 시간 포맷 함수 (기존 로직 유지)
  const formatFullDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* 뒤로가기 버튼 (나중에 하기 대신 사용 가능) */}
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ← BACK TO MENU
        </button>

        <h2 style={styles.header}>📊 PERSONAL RECORDS</h2>

        {loading ? (
          <div style={styles.loading}>데이터 동기화 중...</div>
        ) : (
          <>
            <div style={styles.summaryGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>TOTAL PLAYS</div>
                <div style={styles.statValue}>
                  {data.summary?.totalGames || 0}
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>WIN RATE</div>
                <div style={styles.statValue}>
                  {data.summary?.winRate?.toFixed(1) || 0}%
                </div>
              </div>
            </div>

            <div style={styles.listContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th>DATE / TIME</th>
                    <th>ID</th>
                    <th>LEVEL</th>
                    <th>TIME</th>
                    <th>LIFE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={r.id} style={styles.tr}>
                      <td style={styles.dateCell}>
                        {formatFullDate(r.completedAt)}
                      </td>
                      <td style={styles.idCell}>#{r.boardId}</td>
                      <td>
                        <span style={styles.lvBadge}>Lv.{r.difficulty}</span>
                      </td>
                      <td style={styles.timeCell}>
                        {formatTime(r.elapsedTime)}
                      </td>
                      <td>{"❤️".repeat(r.life)}</td>
                      <td>
                        <span
                          style={
                            r.status === "COMPLETED"
                              ? styles.statusSuccess
                              : styles.statusFail
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.records.length === 0 && (
                <div style={styles.empty}>기록이 없습니다.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// 🎯 스타일 (기존 modal 스타일을 container/content 구조로 살짝 수정)
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#121212",
    padding: "40px 20px",
    color: "#fff",
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#181818",
    borderRadius: "24px",
    padding: "40px",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  header: {
    textAlign: "center",
    marginBottom: "35px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#2196F3",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "35px",
  },
  statCard: {
    backgroundColor: "#222",
    padding: "20px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid #333",
  },
  statLabel: {
    fontSize: "11px",
    color: "#888",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  statValue: { fontSize: "28px", fontWeight: "900" },
  listContainer: { maxHeight: "500px", overflowY: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: {
    borderBottom: "2px solid #333",
    color: "#555",
    fontSize: "11px",
    textAlign: "left",
    paddingBottom: "10px",
  },
  tr: { borderBottom: "1px solid #252525" },
  dateCell: { fontSize: "12px", color: "#aaa", padding: "15px 0" },
  idCell: { fontSize: "12px", color: "#666" },
  lvBadge: {
    backgroundColor: "#333",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12px",
  },
  timeCell: { fontWeight: "bold", color: "#2196F3" },
  statusSuccess: { color: "#4CAF50", fontSize: "12px", fontWeight: "bold" },
  statusFail: { color: "#F44336", fontSize: "12px", fontWeight: "bold" },
  loading: { textAlign: "center", padding: "60px", color: "#666" },
  empty: { textAlign: "center", padding: "40px", color: "#444" },
};

export default RecordsPage;
