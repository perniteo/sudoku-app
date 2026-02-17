package io.github.perniteo.sudoku.repository;

import io.github.perniteo.sudoku.domain.GameRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

// 🎯 XML도, SQL 쿼리도 필요 없습니다!
public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {
  // 기본적으로 save() 메서드가 내장되어 있어 기록 저장이 가능합니다.

  // 나중에 마이페이지 통계 낼 때 "내 기록만 최신순으로 가져오기"가 필요하겠죠?
  // 규칙에 맞춰 이름만 지으면 JPA가 쿼리를 자동으로 만들어줍니다.
  List<GameRecord> findByEmailOrderByCompletedAtDesc(String email);
}