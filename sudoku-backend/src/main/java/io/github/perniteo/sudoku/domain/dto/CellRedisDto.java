package io.github.perniteo.sudoku.domain.dto;

import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CellRedisDto {
  private int v;       // value (이름을 줄여서 Redis 용량 최적화)
  private boolean f;   // fixed
  private Set<Integer> m; // memo
}
