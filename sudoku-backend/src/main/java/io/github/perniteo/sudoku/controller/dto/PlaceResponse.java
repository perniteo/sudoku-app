package io.github.perniteo.sudoku.controller.dto;

public class PlaceResponse {

  private final String result;
  private final int[][] board;
  private final int life;
  private final String status;

  public PlaceResponse(String result, int[][] board, int life, String status) {
    this.result = result;
    this.board = board;
    this.life = life;
    this.status = status;
  }

  public String getResult() {
    return result;
  }

  public int[][] getBoard() {
    return board;
  }

  public int getLife() {
    return life;
  }

  public String getStatus() {
    return status;
  }

}
