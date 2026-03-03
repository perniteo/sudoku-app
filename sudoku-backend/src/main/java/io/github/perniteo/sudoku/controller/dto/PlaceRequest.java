package io.github.perniteo.sudoku.controller.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceRequest {

  private int row;
  private int col;
  private int value;
  private long elapsedTime;
  private String userId;
  private String email;

  public PlaceRequest() {
    // Jackson 역직렬화용 기본 생성자
  }

}
