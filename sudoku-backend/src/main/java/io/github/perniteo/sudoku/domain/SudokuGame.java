package io.github.perniteo.sudoku.domain;

import io.github.perniteo.sudoku.util.generator.GeneratedSudoku;
import java.time.LocalDateTime;

public class SudokuGame {

  private final SudokuBoard board;
  private final LocalDateTime startedAt;
  private boolean cleared;
  private final SudokuBoard puzzleBoard;
  private final SudokuBoard answerBoard;

  public SudokuGame(GeneratedSudoku generated) {
    this.puzzleBoard = generated.getPuzzleBoard();
    this.answerBoard = generated.getAnswerBoard();
    this.board = new SudokuBoard();
    this.startedAt = LocalDateTime.now();
    this.cleared = false;
  }

  public int getValue(int row, int col) {
    return board.getValue(row, col);
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public boolean isCleared() {
    return cleared;
  }

  public void placeNumber(int row, int col, int value) {
    if (board.getValue(row, col) != 0) {
      throw new IllegalStateException("cell already filled");
    }
    board.place(row, col, value);
  }

}
