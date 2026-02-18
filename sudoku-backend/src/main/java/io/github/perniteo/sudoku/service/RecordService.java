package io.github.perniteo.sudoku.service;

import io.github.perniteo.sudoku.controller.dto.RecordResponse;
import io.github.perniteo.sudoku.domain.GameRecord;
import io.github.perniteo.sudoku.domain.GameStatus;
import io.github.perniteo.sudoku.repository.GameRecordRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecordService {
  private final GameRecordRepository recordRepository;

  public RecordResponse getFullRecordInfo(String email) {
    List<GameRecord> records = recordRepository.findByEmailOrderByCompletedAtDesc(email);

    // 통계 계산
    long total = records.size();
    long wins = records.stream().filter(r -> r.getStatus() == GameStatus.COMPLETED).count();

    Map<String, Object> summary = new HashMap<>();
    summary.put("totalGames", total);
    summary.put("winRate", total > 0 ? (double) wins / total * 100 : 0);

    return new RecordResponse(records, summary);
  }
}
