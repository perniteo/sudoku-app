package io.github.perniteo.sudoku.domain;

public class Cell {

  private int value;

  public Cell() {
    this.value = 0;
  }

  public int getValue() {
    return value;
  }

  public void setValue(int value) {
    this.value = value;
  }

  public boolean isEmpty() {
    return value == 0;
  }

}
