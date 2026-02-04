package io.github.perniteo.sudoku.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SudokuBoardRow {
  private int difficulty;
  private String startJson;
  private String answerJson;
}
