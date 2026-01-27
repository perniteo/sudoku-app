package io.github.perniteo.sudoku.util.generator;

import java.io.*;
import java.util.*;
import org.apache.tomcat.util.net.jsse.JSSEUtil;

public class boardGeneratorTemp {

  static ArrayList<int[][]> answerBoards;
  static int[][] board;
  static Random random;

  static int solutionCount;

  static ArrayList<Integer> list = new ArrayList<>();

  public static int randomNumber(int o, int r) {
    return random.nextInt(o, r);
  }

  public static int[][] createBoard() {
    while (true) {
      board = new int[9][9];

      for (int i = 0; i < 9; i++) {
        while (true) {
          int rc = randomNumber(1, 9);
          int rv = randomNumber(1, 10);
          if (isValid(i, rc, rv)) {
            board[i][rc] = rv;
            break;
          }
        }
      }
      for (int i = 0; i < 9; i++) {
        while (true) {
          int rr = randomNumber(1, 9);
          int rv = randomNumber(1, 10);
          if (isValid(rr, i, rv)) {
            board[rr][i] = rv;
            break;
          }
        }
      }
      for (int i = 0; i < 9; i++) {
        while (true) {
          int rc = randomNumber(1, 9);
          int rv = randomNumber(1, 10);
          if (isValid(i, rc, rv)) {
            board[i][rc] = rv;
            break;
          }
        }
      }
      for (int i = 0; i < 9; i++) {
        while (true) {
          int rr = randomNumber(1, 9);
          int rv = randomNumber(1, 10);
          if (isValid(rr, i, rv)) {
            board[rr][i] = rv;
            break;
          }
        }
      }

      if (backTracking()) return board;
    }
  }

  public static int[][] createBoard2() {
    board = new int[9][9];

    while (true) {
      if (backTracking2()) return board;
    }
  }

  public static int[][] createBoard3() {
    board = new int[9][9];

    Collections.shuffle(list);

    for (int i = 0; i < 9; i++) {
      board[0][i] = list.get(i);
    }

    while (true) {
      if (backTracking2()) return board;
    }
  }

  public static ArrayList<Integer> shuffled() {
    Collections.shuffle(list);

    return list;
  }

  public static boolean backTracking2() {
    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          for (int k : shuffled()) {
            if (isValid(i, j, k)) {
              board[i][j] = k;
              if (backTracking2()) {
                return true;
              }
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  public static boolean backTracking3() {
    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          for (int k : shuffled()) {
            if (isValid2(i, j, k)) {
              board[i][j] = k;
              if (backTracking3()) {
                return true;
              }
              board[i][j] = 0;
            }
          }
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
              if (backTracking()) {
                return true;
              }
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  public static boolean backTracking(int[][] board) {
    boolean findAnswer = false;
    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          for (int k = 1; k <= 9; k++) {
            if (isValid(i, j, k, board)) {
              board[i][j] = k;
              if (backTracking(board)) {
                return true;
              }
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  public static void backTracking2(int[][] board) {
    // 이미 2개 이상이면 더 볼 필요 없음
    if (solutionCount >= 2) return;

    for (int i = 0; i < 9; i++) {
      for (int j = 0; j < 9; j++) {
        if (board[i][j] == 0) {
          for (int k = 1; k <= 9; k++) {
            if (isValid(i, j, k, board)) {
              board[i][j] = k;
              backTracking2(board);
              board[i][j] = 0;

              // 가지치기
              if (solutionCount >= 2) return;
            }
          }
          return; // 빈 칸 하나 처리했으면 여기서 종료
        }
      }
    }

    // 여기까지 왔다는 건 → 빈 칸 없음 = 해 1개 발견
    solutionCount++;
  }

  public static boolean isValid(int row, int col, int value) {

    for (int i = 0; i < 9; i++) {
      if (board[row][i] == value || board[i][col] == value) {
        return false;
      }
    }

    int row3x3 = row / 3 * 3;
    int col3x3 = col / 3 * 3;

    for (int i = row3x3; i < row3x3 + 3; i++) {
      for (int j = col3x3; j < col3x3 + 3; j++) {
        if (board[i][j] == value) {
          return false;
        }
      }
    }

    return true;
  }

  public static boolean isValid2(int row, int col, int value) {
    int row3x3 = (row / 3) * 3;
    int col3x3 = (col / 3) * 3;

    for (int i = 0; i < 9; i++) {
      if (board[row][i] == value) return false;
      if (board[i][col] == value) return false;
      if (board[row3x3 + i / 3][col3x3 + i % 3] == value) return false;
    }
    return true;
  }

  public static boolean isValid(int row, int col, int value, int[][] board) {

    for (int i = 0; i < 9; i++) {
      if (board[row][i] == value || board[i][col] == value) {
        return false;
      }
    }

    int row3x3 = row / 3 * 3;
    int col3x3 = col / 3 * 3;

    for (int i = row3x3; i < row3x3 + 3; i++) {
      for (int j = col3x3; j < col3x3 + 3; j++) {
        if (board[i][j] == value) {
          return false;
        }
      }
    }

    return true;
  }

  public static void boardRemover(int[][] board) {
    // 11 shuffled = expert+ ~
    // 8-10 shuffled = hard ~ expert+
    // 6~8 shuffled = normal ~ hard+
    // 4~6 shuffled = easy ~ normal+

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[list.get(i) - 1][i] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[list.get(i) - 1][i] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[list.get(i) - 1][i] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[list.get(i) - 1][i] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[list.get(i) - 1][i] = 0;
    }

    shuffled();

    for (int i = 0; i < 9; i++) {
      board[i][list.get(i) - 1] = 0;
    }

  }

  static boolean uniqueAnswerFinder(int[][] board) {
    solutionCount = 0;
    backTracking2(board);
//    System.out.println(solutionCount);

    return solutionCount == 1;
  }

  public static void main(String[] args) throws IOException{
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

    random = new Random();

    board = new int[9][9];

    answerBoards = new ArrayList<>();

    for (int i = 1; i <= 9; i++) list.add(i);


    for (int i = 0; i < 5000; i++) {
      long startTime = System.nanoTime();
      int[][] board2 = createBoard3();
      long endTime = System.nanoTime();
      double duration = (endTime - startTime) / 1_000_000.0;

      answerBoards.add(board2);

//      System.out.println("logic duration : " + duration + " ms");
    }

    for (int[][] board3 : answerBoards) {
      boardRemover(board3);
      if (uniqueAnswerFinder(board3)) {
        for (int[] b : board3) {
          for (int v : b) {
            System.out.print(v + " ");
          }
          System.out.println();
        }
        System.out.println();
      }
//      System.out.println(uniqueAnswerFinder(board3));
    }

//    while (true) {
//      int[][] expert = createBoard3();
//      boardRemover(expert);
//      if (uniqueAnswerFinder(expert)) {
//        for (int[] e : expert) {
//          for (int value : e) {
//            System.out.print(value + " ");
//          }
//          System.out.println();
//        }
//        break;
//      }
//    }


//    for (int[][] board3 : answerBoards) {
//      for (int[] b : board3) {
//       for (int v : b) {
//          System.out.print(v + " ");
//       }
//       System.out.println();
//     }
//      System.out.println();
//    }



  }
}
