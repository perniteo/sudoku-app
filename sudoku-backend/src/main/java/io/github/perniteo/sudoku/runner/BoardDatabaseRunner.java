package io.github.perniteo.sudoku.runner;

import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.service.BoardGenerateService;
import io.github.perniteo.sudoku.util.generator.BoardGeneratorTemp;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;

//@Component
@RequiredArgsConstructor
public class BoardDatabaseRunner implements CommandLineRunner {

  private final BoardGenerateService boardGenerateService;

  @Override
  public void run(String... args) throws Exception {
    System.out.println("🚀 Sudoku data Generate and Start Insert...");

    // 1. 모듈에서 데이터 가져오기 (new 가능!)
    BoardGeneratorTemp generator = new BoardGeneratorTemp();
    List<SudokuBoardData> dataList = generator.generate(4, 100);

    // 2. DB에 꽂기
    for (SudokuBoardData data : dataList) {
      boardGenerateService.insertData(data);
    }

    System.out.println("✅ Result : " + dataList.size() + "data be stored in DB");
  }
}

