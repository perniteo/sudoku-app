package io.github.perniteo.sudoku.util.generator;

import io.github.perniteo.sudoku.domain.Cell;
import io.github.perniteo.sudoku.domain.SudokuBoard;

public class SudokuGenerator {

  static int[][] board;

  public static boolean isValid(int row, int col, int num) {
    for (int n : board[row]) {
      if (n == num) {
        return false;
      }
    }
    for (int i = 0; i < 9; i++) {
      if (board[i][col] == num) {
        return false;
      }
    }

    int row3x3 = (row / 3) * 3;
    int col3x3 = (col / 3) * 3;

    for (int i = row3x3; i < row3x3 + 3; i++) {
      for (int j = col3x3; j < col3x3 + 3; j++) {
        if (board[i][j] == num) {
          return false;
        }
      }
    }

    return true;
  }

  public static boolean backTracking() {
    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          for (int k = 1; k <= 9; k++) {
            if (isValid(i, j, k)) {
              board[i][j] = k;
              if (backTracking()) return true;
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  public SudokuBoard generateNewBoard() {
    SudokuBoard b = new SudokuBoard(new Cell[9][9]);

    board = new int[9][9];



    return b;
  }

  public GeneratedSudoku generate() {
    int[][] answerValues = {
        {5,3,4,6,7,8,9,1,2},
        {6,7,2,1,9,5,3,4,8},
        {1,9,8,3,4,2,5,6,7},
        {8,5,9,7,6,1,4,2,3},
        {4,2,6,8,5,3,7,9,1},
        {7,1,3,9,2,4,8,5,6},
        {9,6,1,5,3,7,2,8,4},
        {2,8,7,4,1,9,6,3,5},
        {3,4,5,2,8,6,1,7,9}
    };

    int[][] puzzleValues = {
        {5,3,0,6,7,0,0,1,2},
        {6,0,2,1,0,5,3,4,0},
        {0,9,8,0,4,2,5,0,7},
        {8,0,9,7,6,0,4,2,0},
        {4,2,0,8,0,3,0,9,1},
        {7,0,3,0,2,4,8,0,6},
        {0,6,1,5,3,0,2,8,0},
        {2,8,0,4,1,9,0,3,5},
        {3,4,5,0,8,6,1,7,0}
    };

    SudokuBoard answerBoard = new SudokuBoard(createCells(answerValues, true));
    SudokuBoard puzzleBoard = new SudokuBoard(createCells(puzzleValues, false));
    return new GeneratedSudoku(puzzleBoard, answerBoard, 1, 1);
  }

  private Cell[][] createCells(int[][] values, boolean allFixed) {
    Cell[][] cells = new Cell[9][9];

    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        int value = values[r][c];
        boolean fixed = allFixed || value != 0;
        cells[r][c] = new Cell(value, fixed);
      }
    }
    return cells;
  }
}

