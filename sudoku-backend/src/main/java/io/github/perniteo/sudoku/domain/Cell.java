package io.github.perniteo.sudoku.domain;

public class Cell {

  private int value;
  private final boolean fixed;

  public Cell(int value, boolean fixed) {
    this.value = value;
    this.fixed = fixed;
  }

  public int getValue() {
    return value;
  }

  public void setValue(int value) {
    if (fixed) {
      throw new IllegalStateException("fixed cell");
    }
    this.value = value;
  }

  public boolean isEmpty() {
    return value == 0;
  }

  public boolean isFixed() {
    return fixed;
  }
}
