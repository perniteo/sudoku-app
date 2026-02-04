package io.github.perniteo.sudoku.controller.dto;

import lombok.Getter;

@Getter
public class GameStartResponse {

  String gameId;
  int[][] board;
  String status;

  public GameStartResponse(String gameId, int[][] board, String status) {
    this.gameId = gameId;
    this.board = board;
    this.status = status;
  }

}
