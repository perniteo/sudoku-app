package io.github.perniteo.sudoku.controller.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GameStartRequest {
  private int difficulty;
}
