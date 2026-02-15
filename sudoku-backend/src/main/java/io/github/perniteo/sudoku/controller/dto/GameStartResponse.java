package io.github.perniteo.sudoku.controller.dto;

import io.github.perniteo.sudoku.domain.dto.CellRedisDto;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GameStartResponse {

  String gameId;
  CellRedisDto[][] board;
  String status;

}
