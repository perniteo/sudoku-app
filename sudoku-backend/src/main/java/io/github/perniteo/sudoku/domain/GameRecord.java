package io.github.perniteo.sudoku.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_records") // DB 테이블 이름
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 지연 로딩 및 프록시를 위한 필수 설정
@AllArgsConstructor
@Builder
public class GameRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // PostgreSQL의 SERIAL(AUTO_INCREMENT)과 매핑
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private int difficulty;

    @Column(nullable = false)
    private long elapsedTime;

    @Column(nullable = false)
    private int life;

    @Enumerated(EnumType.STRING) // Enum 이름을 문자열 그대로 DB에 저장 (안전함)
    @Column(nullable = false)
    private GameStatus status; // COMPLETED, FAILED

    @Column(nullable = false, updatable = false)
    private LocalDateTime completedAt;

    // 생성 시점에 시간을 자동으로 넣어주는 편의 메서드
    @PrePersist
    protected void onCreate() {
      this.completedAt = LocalDateTime.now();
  }
}
