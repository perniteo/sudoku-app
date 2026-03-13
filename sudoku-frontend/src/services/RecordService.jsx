import api from "../api";

export const RecordService = {
  // 🎯 전체 기록 및 통계 요약 가져오기
  fetchAllRecords: async () => {
    // 백엔드 엔드포인트에 맞춰 수정 (예: /api/records/all)
    const res = await api.get("/api/records/all");
    return res.data; // { records: [], summary: {} } 구조라고 가정
  },
};
