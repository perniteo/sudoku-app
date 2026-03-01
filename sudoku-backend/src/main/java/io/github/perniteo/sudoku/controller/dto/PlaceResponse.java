package io.github.perniteo.sudoku.controller.dto;

import io.github.perniteo.sudoku.domain.dto.CellRedisDto;

public class PlaceResponse {

  private final String result;
  private final CellRedisDto[][] board;
  private final int life;
  private final String status;
  private final long elapsedTime;
  private final String lastInteract; // 마지막으로 입력

  public PlaceResponse(String result, CellRedisDto[][] board, int life,
      String status, long elapsedTime, String lastInteract) {
    this.result = result;
    this.board = board;
    this.life = life;
    this.status = status;
    this.elapsedTime = elapsedTime;
    this.lastInteract = lastInteract;
  }

  public String getResult() {
    return result;
  }

  public CellRedisDto[][] getBoard() {
    return board;
  }

  public int getLife() {
    return life;
  }

  public String getStatus() { return status; }

  public long getElapsedTime() {return elapsedTime;}

  public String getLastInteract() { return lastInteract; }
}
