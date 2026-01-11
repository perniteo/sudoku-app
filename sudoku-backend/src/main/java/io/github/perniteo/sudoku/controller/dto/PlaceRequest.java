package io.github.perniteo.sudoku.controller.dto;

public class PlaceRequest {

  private int row;
  private int col;
  private int value;

  public PlaceRequest() {
    // Jackson 역직렬화용 기본 생성자
  }

  public int getRow() {
    return row;
  }
  public int getCol() {
    return col;
  }
  public int getValue() {
    return value;
  }
}
