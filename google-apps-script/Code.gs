/**
 * Braze 알림톡 Liquid 변환기 — 오류 해결방안 공유 DB
 *
 * Google Sheets를 데이터베이스로 사용합니다.
 * 시트1의 컬럼 구조:
 *   A: errorPattern  (에러 패턴)
 *   B: description   (해결방법 설명)
 *   C: fixedCode     (수정된 코드)
 *   D: savedAt       (저장 일시)
 *
 * 배포 방법:
 *   1. Google Sheet > 확장 프로그램 > Apps Script
 *   2. 이 코드를 붙여넣기
 *   3. 배포 > 새 배포 > 웹 앱
 *      - 실행 주체: 나
 *      - 액세스 권한: 모든 사용자
 *   4. 배포 URL을 errorStore.ts의 SHEET_CONFIG에 입력
 */

/**
 * GET 요청: 시트의 모든 데이터를 JSON 배열로 반환
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('시트1');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    }

    var data = sheet.getDataRange().getValues();

    // 첫 행은 헤더
    if (data.length <= 1) {
      return createJsonResponse([]);
    }

    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // 빈 행 건너뛰기
      if (!row[0] || row[0].toString().trim() === '') continue;

      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j] ? row[j].toString() : '';
      }
      results.push(obj);
    }

    return createJsonResponse(results);
  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

/**
 * POST 요청: 새 해결방안을 시트에 추가 (중복 시 업데이트)
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    var errorPattern = body.errorPattern || '';
    var description = body.description || '';
    var fixedCode = body.fixedCode || '';
    var savedAt = body.savedAt || new Date().toISOString();

    if (!errorPattern) {
      return createJsonResponse({ success: false, error: 'errorPattern is required' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('시트1');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    }

    var data = sheet.getDataRange().getValues();

    // 중복 체크: 같은 errorPattern이 있으면 업데이트
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === errorPattern) {
        // 기존 행 업데이트
        sheet.getRange(i + 1, 2).setValue(description);
        sheet.getRange(i + 1, 3).setValue(fixedCode);
        sheet.getRange(i + 1, 4).setValue(savedAt);
        found = true;
        break;
      }
    }

    if (!found) {
      // 새 행 추가
      sheet.appendRow([errorPattern, description, fixedCode, savedAt]);
    }

    return createJsonResponse({ success: true, updated: found });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * JSON 응답 생성 (CORS 허용)
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
