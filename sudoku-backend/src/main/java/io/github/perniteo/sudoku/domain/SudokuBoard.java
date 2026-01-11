package io.github.perniteo.sudoku.domain;

public class SudokuBoard {

  private final Cell[][] cells;

  public SudokuBoard(Cell[][] cells) {
    this.cells = cells;
  }

  public int getValue(int row, int col) {
    validatePosition(row, col);
    return cells[row][col].getValue();
  }

  public boolean isFixed(int row, int col) {
    validatePosition(row, col);
    return cells[row][col].isFixed();
  }


  public void place(int row, int col, int value) {
    validatePosition(row, col);
    validateValue(value);

    cells[row][col].setValue(value);
  }

  public boolean isCompleted() {
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        if (cells[r][c].isEmpty()) {
          return false;
        }
      }
    }
    return true;
  }

  public boolean isCorrect(int row, int col, int value) {
    validatePosition(row, col);
    return cells[row][col].getValue() == value;
  }

  private void validatePosition(int row, int col) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) {
      throw new IllegalArgumentException("invalid position");
    }

    // 자리 유효성 검사 구현 추가 필요
  }

  private void validateValue(int value) {
    if (value < 0 || value > 9) {
      throw new IllegalArgumentException("invalid value");
    }
  }


}
