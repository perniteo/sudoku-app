package io.github.perniteo.sudoku.dto;

public class GameStartResponse {

  String gameId;
  int[][] board;
  String status;

  public GameStartResponse(String gameId, int[][] board, String status) {
    this.gameId = gameId;
    this.board = board;
    this.status = status;
  }

  public String getGameId() {return gameId;}
  public int[][] getBoard() {return board;}
  public String getStatus() {return status;}

}
