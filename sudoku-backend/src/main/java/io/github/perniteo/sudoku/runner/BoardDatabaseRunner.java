package io.github.perniteo.sudoku.runner;

import io.github.perniteo.sudoku.dto.SudokuBoardData;
import io.github.perniteo.sudoku.service.BoardGenerateService;
import io.github.perniteo.sudoku.util.generator.BoardGeneratorTemp;
import io.github.perniteo.sudoku.util.generator.BoardGeneratorV2;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BoardDatabaseRunner implements CommandLineRunner {

  private final BoardGenerateService boardGenerateService;

  @Override
  public void run(String... args) throws Exception {
//    BoardGeneratorTemp tempGen = new BoardGeneratorTemp();
//    BoardGeneratorV2 maskGen = new BoardGeneratorV2();
//
//    int attempt = 500;
//    int lv = 11;
//    int repeat = 10; // 반복 횟수
//
//    int totalTempBoards = 0;
//    int totalMaskBoards = 0;
//
//    double totalTempTime = 0;
//    double totalMaskTime = 0;
//
//    for (int i = 0; i < repeat; i++) {
//      tempGen = new BoardGeneratorTemp();
//      maskGen = new BoardGeneratorV2();
//
//      // --- Temp ---
//      long start = System.nanoTime();
//      List<SudokuBoardData> tempList = tempGen.generate(lv, attempt);
//      long end = System.nanoTime();
//      double tempDuration = (end - start) / 1_000_000.0; // ms
//      totalTempBoards += tempList.size();
//      totalTempTime += tempDuration;
//      System.out.println("Run " + i + " Temp: " + tempList.size() + " boards, " + tempDuration + " ms");
//
//      // --- Mask ---
//      start = System.nanoTime();
//      List<SudokuBoardData> maskList = maskGen.generate(lv, attempt);
//      end = System.nanoTime();
//      double maskDuration = (end - start) / 1_000_000.0; // ms
//      totalMaskBoards += maskList.size();
//      totalMaskTime += maskDuration;
//      System.out.println("Run " + i + " Mask: " + maskList.size() + " boards, " + maskDuration + " ms");
//
//      System.out.println("----------------------------------------------------");
//    }
//
//// --- 총합과 평균 ---
//    System.out.println("Total Temp: " + totalTempBoards + " boards, Average Time: " + (totalTempTime / repeat) + " ms");
//    System.out.println("Total Mask: " + totalMaskBoards + " boards, Average Time: " + (totalMaskTime / repeat) + " ms");
    System.out.println("🚀 Sudoku data Generate and Start Insert...");

    // 1. 모듈에서 데이터 가져오기 (new 가능!)
    int attempt = 500;
    for (int level = 10; level <= 11; level++) {
      BoardGeneratorTemp generator = new BoardGeneratorTemp(); // 여기서 새로 생성
      System.out.println("Lv." + level +  " Attempt : " + attempt + " times...");
      List<SudokuBoardData> dataList = generator.generate(level, attempt);
      for (SudokuBoardData data : dataList) {
        boardGenerateService.insertData(data);
      }
      System.out.println("✅ Result : " + dataList.size() + "data be stored in DB");
    }
  }
}

