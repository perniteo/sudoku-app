package io.github.perniteo.sudoku.controller.dto;

import io.github.perniteo.sudoku.domain.dto.CellRedisDto;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameContinueResponse {
  private String gameId;
  private CellRedisDto[][] board;
  private String status;
  private int difficulty;
  private int life;
  private long elapsedTime; // 이어받을 시간을 프론트에 전달
}