package io.github.perniteo.sudoku.domain;

import java.util.Set;
import lombok.Getter;

@Getter
public class Cell {

  private int value;
  private boolean fixed;
  private Set<Integer> memo;

  public Cell(int value, boolean fixed) {
    this.value = value;
    this.fixed = fixed;
  }

  public Cell(int value, boolean fixed, Set<Integer> memo) {
    this.value = value;
    this.fixed = fixed;
    this.memo = memo;
  }

  public void setValue(int value) {
    if (fixed) {
      throw new IllegalStateException("fixed cell");
    }
    this.value = value;
  }

  public void setMemo(int value) {
    if (fixed) {
      throw new IllegalArgumentException("fixed cell");
    }

    if (memo.contains(value)) {
      memo.remove(value);
    } else {
      memo.add(value);
    }
  }

  public boolean isEmpty() {
    return value == 0;
  }

  public void fix() {
    this.fixed = true;
  }

}
