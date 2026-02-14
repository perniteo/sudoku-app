package io.github.perniteo.sudoku.domain;

import io.github.perniteo.sudoku.domain.dto.CellRedisDto;

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
    cells[row][col].fix();
  }

  public void erase(int row, int col) {
    validatePosition(row, col);
    cells[row][col].setValue(0);
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

  /**
   * [직렬화] 현재 보드의 숫자 상태를 2차원 배열로 추출 (주로 정답지 저장용)
   */
  public int[][] getMatrix() {
    int[][] matrix = new int[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        matrix[r][c] = cells[r][c].getValue();
      }
    }
    return matrix;
  }

  /**
   * [역직렬화] 단순 2차원 배열로부터 보드 객체 생성 (주로 게임 시작 시 정답지 복구용)
   */
  public static SudokuBoard from(int[][] board) {
    Cell[][] cells = new Cell[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        int value = board[r][c];
        // 0이 아니면 고정(fixed)된 힌트로 간주
        boolean fixed = (value != 0);
        cells[r][c] = new Cell(value, fixed);
      }
    }
    return new SudokuBoard(cells);
  }



  /**
   * [직렬화] 모든 Cell의 상태(값, 고정여부, 메모)를 DTO 배열로 변환
   */
  public CellRedisDto[][] getCellSnapshots() {
    CellRedisDto[][] snapshots = new CellRedisDto[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        Cell cell = cells[r][c];
        snapshots[r][c] = new CellRedisDto(
            cell.getValue(),
            cell.isFixed(),
            cell.getMemo()
        );
      }
    }
    return snapshots;
  }

  /**
   * [역직렬화] DTO 배열로부터 SudokuBoard 복구
   */
  public static SudokuBoard fromSnapshots(CellRedisDto[][] snapshots) {
    Cell[][] cells = new Cell[9][9];
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        CellRedisDto dto = snapshots[r][c];
        cells[r][c] = new Cell(dto.getV(), dto.isF(), dto.getM());
      }
    }
    return new SudokuBoard(cells);
  }



}
