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
    validatePlacement(row, col, value);

    cells[row][col].setValue(value);
  }

  private void validatePlacement(int row, int col, int value) {
    validatePosition(row, col);

    if (value == 0) return;

    if (!isRowValid(row, col, value)
        || !isColValid(row, col, value)
        || !isBoxValid(row, col, value)) {
      throw new IllegalArgumentException("invalid sudoku rule");
    }
  }

  private boolean isBoxValid(int row, int col, int value) {
    int boxRowStart = row / 3 * 3;
    int boxColStart = col / 3 * 3;
    for (int r = boxRowStart; r < boxRowStart + 3; r++) {
      for (int c = boxColStart; c < boxColStart + 3; c++) {
        if (row == r && col == c) continue;

        if (cells[r][c].getValue() == value) return false;
      }
    }

    return true;
  }

  private boolean isColValid(int row, int col, int value) {
    for (int r = 0; r < 9; r++) {
      if (r == row) continue;

      if (cells[r][col].getValue() == value) {
        return false;
      }
    }

    return true;
  }

  private boolean isRowValid(int row, int col, int value) {
    for (int c = 0; c < 9; c++) {
      if (c == col) continue;

      if (cells[row][c].getValue() == value) {
        return false;
      }
    }
    return true;
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
