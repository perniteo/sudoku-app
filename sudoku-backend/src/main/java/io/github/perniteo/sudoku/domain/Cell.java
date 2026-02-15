package io.github.perniteo.sudoku.domain;

import java.util.HashSet;
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
    // 서버에서 불러올 때 memo가 null이면 빈 HashSet으로 초기화
    this.memo = (memo == null) ? new HashSet<>() : memo;
  }

  public void setValue(int value) {
    if (fixed) {
      throw new IllegalStateException("fixed cell");
    }
    this.value = value;
  }

  public void toggleMemo(int value) {
    // 혹시 모를 null 체크 (방어 코드)
    if (this.memo == null) {
      this.memo = new HashSet<>();
    }
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
