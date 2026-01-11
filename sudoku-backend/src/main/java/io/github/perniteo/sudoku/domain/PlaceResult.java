package io.github.perniteo.sudoku.domain;

public enum PlaceResult {

  CORRECT(true, "정답입니다"),
  WRONG(false, "틀렸습니다"),
  ALREADY_FIXED(false, "이미 고정된 칸입니다"),
  GAME_OVER(false, "게임 오버");

  private final boolean success;
  private final String message;

  PlaceResult(boolean success, String message) {
    this.success = success;
    this.message = message;
  }

  public boolean isSuccess() {
    return success;
  }

  public String getMessage() {
    return message;
  }
}
