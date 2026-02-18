// 🎯 App.js에서 data(records, summary)와 loading 상태를 받습니다.
const RecordOverlay = ({ records, summary, loading, onClose, formatTime }) => {
  // 🎯 날짜 포맷 함수 (분/초 포함)
  const formatFullDate = (dateString) => {
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

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>
        <h2 style={styles.header}>📊 PERSONAL RECORDS</h2>

        {loading ? (
          <div style={styles.loading}>데이터 동기화 중...</div>
        ) : (
          <>
            {/* 상단 요약 카드 (App.js에서 받은 summary 사용) */}
            <div style={styles.summaryGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>TOTAL PLAYS</div>
                <div style={styles.statValue}>{summary?.totalGames || 0}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>WIN RATE</div>
                <div style={styles.statValue}>
                  {summary?.winRate?.toFixed(1) || 0}%
                </div>
              </div>
            </div>

            {/* 상세 리스트 (App.js에서 받은 records 사용) */}
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
                  {records.map((r) => (
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
              {records.length === 0 && (
                <div style={styles.empty}>기록이 없습니다.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  // ... 기존 backdrop, modal, closeBtn, header, summaryGrid, statCard 등은 유지
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#181818",
    color: "#fff",
    width: "95%",
    maxWidth: "750px",
    borderRadius: "24px",
    padding: "40px",
    position: "relative",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  },
  closeBtn: {
    position: "absolute",
    top: "20px",
    right: "25px",
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "32px",
    cursor: "pointer",
  },
  header: {
    textAlign: "center",
    marginBottom: "35px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#2196F3",
    letterSpacing: "1px",
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
  listContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    paddingRight: "10px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: {
    borderBottom: "2px solid #333",
    color: "#555",
    fontSize: "11px",
    fontWeight: "bold",
    textAlign: "left",
  },
  tr: { borderBottom: "1px solid #252525" },
  dateCell: { fontSize: "12px", color: "#aaa", padding: "15px 0" },
  idCell: { fontSize: "12px", color: "#666", fontWeight: "mono" },
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

export default RecordOverlay;
