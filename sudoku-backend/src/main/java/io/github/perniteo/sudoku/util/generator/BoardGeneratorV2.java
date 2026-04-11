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

  public static ArrayList<Integer> shuffled() {
    Collections.shuffle(list);

    return list;
  }

  // --------------------------------------------
  // Mask 기반 백트래킹
  // --------------------------------------------
  private boolean backTrackingMask() {
    for (int r = 0; r < 9; r++) {
      for (int c = 0; c < 9; c++) {
        if (board[r][c] == 0) {
          for (int num : shuffled()) {
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

  private void backTrackingUniqueV2() {
    // 1. 이미 해가 2개 이상 발견되었다면 즉시 모든 재귀 종료 (가지치기)
    if (solutionCount >= 2) return;

    int r = -1;
    int c = -1;

    // 2. 빈 칸 찾기 (가장 처음 만나는 0 찾기)
    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          r = i;
          c = j;
          break;
        }
      }
      if (r != -1) break;
    }

    // 3. 모든 칸이 채워졌다면 해답 발견
    if (r == -1) {
      solutionCount++;
      return;
    }

    // 4. 1부터 9까지 "고정된 순서"로 시도 (Temp 방식의 장점 도입)
    // list를 돌지 않고 직접 1~9를 체크하여 캐시 효율과 예측 가능성을 높임
    for (int num = 1; num <= 9; num++) {
      int bit = 1 << (num - 1);
      int boxIndex = (r / 3) * 3 + (c / 3);

      // Mask를 이용한 빠른 유효성 검사
      if ((rowMask[r] & bit) == 0 &&
          (colMask[c] & bit) == 0 &&
          (boxMask[boxIndex] & bit) == 0) {

        // 상태 업데이트
        board[r][c] = num;
        rowMask[r] |= bit;
        colMask[c] |= bit;
        boxMask[boxIndex] |= bit;

        // 재귀 호출
        backTrackingUniqueV2();

        // 백트래킹 (원상복구)
        board[r][c] = 0;
        rowMask[r] ^= bit;
        colMask[c] ^= bit;
        boxMask[boxIndex] ^= bit;

        // 5. 탐색 중 해가 2개 이상이 되면 더 이상 숫자를 넣어볼 필요 없음
        if (solutionCount >= 2) return;
      }
    }
  }


  private boolean uniqueAnswerFinder() {
    solutionCount = 0;
    backTrackingUniqueV2();
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