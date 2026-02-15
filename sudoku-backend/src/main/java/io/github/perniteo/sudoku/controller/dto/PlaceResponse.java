package io.github.perniteo.sudoku.controller.dto;

import io.github.perniteo.sudoku.domain.dto.CellRedisDto;

public class PlaceResponse {

  private final String result;
  private final CellRedisDto[][] board;
  private final int life;
  private final String status;

  public PlaceResponse(String result, CellRedisDto[][] board, int life, String status) {
    this.result = result;
    this.board = board;
    this.life = life;
    this.status = status;
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

  public String getStatus() {
    return status;
  }

}
