package io.github.perniteo.sudoku.domain;

public class SudokuBoard {

  private final Cell[][] cells;

  public SudokuBoard() {
    cells = new Cell[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        cells[r][c] = new Cell();
      }
    }
  }

  public int getValue(int row, int col) {
    return cells[row][col].getValue();
  }

  public void place(int row, int col, int value) {
    validatePosition(row, col);
    validateValue(value);

    cells[row][col].setValue(value);
  }

  private void validatePosition(int row, int col) {
    if (row < 0 || row >= 9 || col < 0 || col >= 9) {
      throw new IllegalArgumentException("invalid position");
    }
  }

  private void validateValue(int value) {
    if (value < 0 || value > 9) {
      throw new IllegalArgumentException("invalid value");
    }
  }


}
