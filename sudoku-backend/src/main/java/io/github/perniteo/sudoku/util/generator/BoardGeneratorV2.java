package io.github.perniteo.sudoku.util.generator;

import io.github.perniteo.sudoku.dto.SudokuBoardData;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;

public class BoardGeneratorV2 {

  static int[][] board;
  static ArrayList<Integer> list = new ArrayList<>();

  static int[] rowMask = new int[9];
  static int[] colMask = new int[9];
  static int[] boxMask = new int[9];

  static int solutionCount;

  private void initList() {
    list.clear();
    for (int i = 1; i <= 9; i++) list.add(i);
    Collections.shuffle(list); // 한 번만 shuffle
  }

  // --------------------------------------------
  // Board 생성
  // --------------------------------------------
  public int[][] createBoard() {
    board = new int[9][9];
    Arrays.fill(rowMask, 0);
    Arrays.fill(colMask, 0);
    Arrays.fill(boxMask, 0);

    // 첫 줄 랜덤 배치
    Collections.shuffle(list);
    for (int i = 0; i < 9; i++) {
      int num = list.get(i);
      board[0][i] = num;
      int bit = 1 << (num - 1);
      rowMask[0] |= bit;
      colMask[i] |= bit;
      boxMask[i / 3] |= bit;
    }

    while (!backTrackingMask()) {
      // 계속 재시도
    }
    return board;
  }

  // --------------------------------------------
  // Mask 기반 백트래킹
  // --------------------------------------------
  private boolean backTrackingMask() {
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        if (board[r][c] == 0) {
          for (int num : list) {
            int bit = 1 << (num - 1);
            int boxIndex = (r / 3) * 3 + (c / 3);
            if ((rowMask[r] & bit) == 0 &&
                (colMask[c] & bit) == 0 &&
                (boxMask[boxIndex] & bit) == 0) {

              // 놓기
              board[r][c] = num;
              rowMask[r] |= bit;
              colMask[c] |= bit;
              boxMask[boxIndex] |= bit;

              if (backTrackingMask()) return true;

              // 되돌리기
              board[r][c] = 0;
              rowMask[r] ^= bit;
              colMask[c] ^= bit;
              boxMask[boxIndex] ^= bit;
            }
          }
          return false;
        }
      }
    }
    return true; // 완성
  }

  // --------------------------------------------
  // Mask 기반 유일 답 체크
  // --------------------------------------------
  private void backTrackingUnique() {
    if (solutionCount >= 2) return;

    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        if (board[r][c] == 0) {
          for (int num : list) {
            int bit = 1 << (num - 1);
            int boxIndex = (r / 3) * 3 + (c / 3);
            if ((rowMask[r] & bit) == 0 &&
                (colMask[c] & bit) == 0 &&
                (boxMask[boxIndex] & bit) == 0) {

              // 놓기
              board[r][c] = num;
              rowMask[r] |= bit;
              colMask[c] |= bit;
              boxMask[boxIndex] |= bit;

              backTrackingUnique();

              // 되돌리기
              board[r][c] = 0;
              rowMask[r] ^= bit;
              colMask[c] ^= bit;
              boxMask[boxIndex] ^= bit;
            }
          }
          return;
        }
      }
    }

    solutionCount++;
  }

  private boolean uniqueAnswerFinder() {
    solutionCount = 0;
    backTrackingUnique();
    return solutionCount == 1;
  }

  // --------------------------------------------
  // Board Remover (Temp 그대로 사용)
  // --------------------------------------------
  private static void boardRemover(int[][] board, int shuffled) {
    for (int s = 0; s < shuffled; s++) {
      Collections.shuffle(list);
      if (s % 2 == 0) {
        for (int i = 0; i < 9; i++) {
          board[i][list.get(i) - 1] = 0;
        }
      } else {
        for (int i = 0; i < 9; i++) {
          board[list.get(i) - 1][i] = 0;
        }
      }
    }
  }

  // --------------------------------------------
  // Generate
  // --------------------------------------------
  public ArrayList<SudokuBoardData> generate(int level, int number) {
    initList();
    ArrayList<SudokuBoardData> generated = new ArrayList<>();

    for (int i = 0; i < number; i++) {
      int[][] cBoard = createBoard();

      int[][] answer = new int[9][9];
      for (int r = 0; r < 9; r++) System.arraycopy(cBoard[r], 0, answer[r], 0, 9);

      boardRemover(cBoard, level);

      // Mask로 유일 답 확인
      Arrays.fill(rowMask, 0);
      Arrays.fill(colMask, 0);
      Arrays.fill(boxMask, 0);
      for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
          int val = cBoard[r][c];
          if (val != 0) {
            int bit = 1 << (val - 1);
            rowMask[r] |= bit;
            colMask[c] |= bit;
            boxMask[(r / 3) * 3 + (c / 3)] |= bit;
          }
        }
      }

      if (uniqueAnswerFinder()) {
        generated.add(SudokuBoardData.builder()
            .initialBoard(cBoard)
            .solutionBoard(answer)
            .difficulty(level)
            .build());
      }
    }

    return generated;
  }
}