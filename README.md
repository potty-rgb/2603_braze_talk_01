# Braze 알림톡 Liquid 변환기

카카오 알림톡 템플릿을 Braze Liquid 코드로 자동 변환하는 웹 서비스입니다.

비즈뿌리오(비뿌) 템플릿 원문과 발송 원문을 입력하면, Braze 메시지 에디터에 바로 붙여넣기 가능한 Liquid 코드를 생성합니다.

## 접속 방법

- **서비스 URL**: https://potty-rgb.github.io/2603_braze_talk_01/
- **로컬 개발**: `npm install && npm run dev` → http://localhost:5173

---

## 사용 방법

### 홈화면

서비스에 접속하면 팀원 닉네임과 응원 메시지가 5초 간격으로 롤링 표시되며, 3가지 기능 카드가 표시됩니다.

| 카드 | 설명 |
|------|------|
| **버튼 O 템플릿** | 버튼(웹링크)이 포함된 알림톡 → Liquid 변환 |
| **버튼 X 템플릿** | 버튼 없이 텍스트만 있는 알림톡 → Liquid 변환 |
| **오류 해결하기** | Braze 발송 오류 진단 및 자동 수정 (Liquid 변환 없이 바로 사용) |

### 단계별 흐름 (3단계)

| 단계 | 이름 | 설명 |
|------|------|------|
| **Step 1** | 정보 입력 | 템플릿 원문, 발송 원문, 템플릿 코드 등 입력 |
| **Step 2** | 결과 확인 | 변수 매칭 결과 및 Liquid 코드 확인 · 복사 |
| **Step 3** | 오류 진단 | 발송 오류 진단 및 자동 수정 (3열 레이아웃으로 동시 표시) |

> 타입 선택(버튼 O / 버튼 X)은 홈화면에서 수행하며, 이후 **정보 입력 | 결과 확인 | 오류 진단** 3열 레이아웃으로 한눈에 확인할 수 있습니다.

### Step 1. 정보 입력

#### 공통 필드

| 필드 | 설명 | 입력 예시 |
|------|------|----------|
| **템플릿 원문** | 비뿌 템플릿 원본 그대로 복사 (`#{변수}` 포함) | `#{강의명}의 #{쿠폰내용} 쿠폰이 오늘 밤에 마감돼요!` |
| **발송 원문** | 변수값이 치환된 최종 발송 문안 | `<2026NEW! 서울투자 기초반>의 재수강 투자 응원 6만원 쿠폰이...` |
| **템플릿 코드** | 비즈뿌리오에 등록된 템플릿 코드 | `bizp_2025123103044120835684085` |
| **알림톡 타입** | AT(알림톡) 또는 AI(이미지 알림톡) | 드롭다운 선택 |
| **메시지 유형** | info(정보성) 또는 ad(광고성) | 드롭다운 선택 |

#### 버튼 O 추가 필드

| 필드 | 설명 | 입력 예시 |
|------|------|----------|
| **버튼명** | 비뿌 템플릿 버튼명 그대로 | `자세히 보기🎁` |
| **url변수** | 비뿌 버튼 URL 변수 (`http://`, `https://`, 또는 공란) | `https://` |
| **UTM** | 생성한 UTM 원본 그대로 | `https://weolbu.com/event?utm_source=katalk&...` |

### Step 2. 결과 확인 및 복사

- **변수 매칭 결과**: 자동 추출된 변수, 값, 영어 변수명 확인 (수정 가능)
- **Liquid 코드**: 섹션별 색상 구분 (파란색 = 확인 필요, 회색 = 고정)
- **전체 복사** 버튼 → Braze 메시지 에디터에 붙여넣기

### Step 3. 오류 진단

3열 레이아웃의 우측 패널에서 바로 오류를 진단할 수 있습니다.
생성된 Liquid 코드가 자동으로 연결되어, 오류 메시지만 입력하면 됩니다.

---

## 주요 기능

### 변수 자동 변환

템플릿 원문의 `#{한글변수명}`을 자동으로 영어 변수명으로 변환합니다.

- **사전 매칭**: 약 87개의 자주 사용되는 한글 변수명이 등록되어 있습니다
  - 예: `#{강의명}` → `lecture_name`, `#{만료일시}` → `expiration_datetime`
- **로마자 자동생성**: 사전에 없는 변수는 한글 로마자 변환으로 자동 생성됩니다
  - 예: `#{수강생이름}` → `su_gang_saeng_i_reum`
- 자동 생성된 변수명은 "자동생성" 뱃지로 표시되며, 직접 수정할 수 있습니다

### 오류 진단 기능 (대화형 UI)

Braze 테스트 발송 시 오류가 발생했을 때 원인을 진단하고 자동으로 수정합니다.

#### 접근 방법 (2가지 모드)

| 모드 | 접근 | 특징 |
|------|------|------|
| **Standalone 모드** | 홈화면 "오류 해결하기" 카드 클릭 | 오류 메시지 + Liquid 코드를 순서 무관하게 입력 |
| **Connected 모드** | 3열 레이아웃 우측 패널 | 생성된 Liquid 코드가 자동 연결, 오류 메시지만 입력. 수정 시 결과 확인 열 자동 반영 |

#### 대화형 진단 흐름
채팅 형태의 UI에서 여러 오류를 연속으로 진단할 수 있습니다.

1. **오류 메시지 입력**: Braze 테스트 발송 시 받은 오류를 그대로 붙여넣기
2. **자동 진단**: 원인 분석 + 수정 내역 표시 + 수정된 코드 복사
3. **반복 진단**: 다른 오류가 있으면 바로 이어서 입력
4. **로딩 인디케이터**: 진단 처리 중 바운싱 도트 표시

#### Standalone 모드 후속 진단

첫 진단 이후 새 오류를 입력하면 선택지가 표시됩니다:

| 선택지 | 동작 |
|--------|------|
| **같은 코드의 다른 오류** | 마지막 수정된 코드 기반으로 재진단 |
| **다른 코드의 오류 (리셋)** | 대화 초기화 후 새 코드/오류 입력 대기 |

새 Liquid 코드를 입력하면 자동으로 코드를 교체하고 오류 입력을 대기합니다.

#### Connected 모드 자동 반영

Connected 모드에서 오류 수정 시 수정된 코드가 결과 확인 열에 자동 반영됩니다.
결과 확인 열의 "전체 복사" 버튼으로 수정된 코드를 바로 복사할 수 있습니다.

#### 지원하는 오류 유형

| 오류 | 원인 | 자동 수정 |
|------|------|----------|
| `Unexpected token \t` | 탭 문자 혼입 | 탭 → 공백 치환 |
| `Unexpected token \n` | 줄바꿈 혼입 | 줄바꿈 제거 |
| `Unexpected token "` | 큰따옴표 미이스케이프 | `"` → `\"` |
| `Unexpected token '` | 작은따옴표 충돌 | `'` → `\'` |
| `Unexpected token \` | 백슬래시 미이스케이프 | `\` → `\\` |
| `Unexpected token 🎁` (이모지 등) | 다문자 토큰 혼입 | json_escape 필터 추가 등 |
| `The to field is required` | 수신번호(to) 필드 누락 | Braze 설정 안내 |
| `{"code":200}` | 200 OK 발송 실패 | 비즈뿌리오 발송 결과 확인 안내 (흐름도 시각화) |
| 인식 불가 오류 | 미분류 오류 | AI 서비스 안내 (오류 + 코드 복사) |

#### 200 OK 오류 진단

`{"code":200}` 오류는 Braze → 비즈뿌리오 API 요청은 성공했으나 비즈뿌리오가 실제 메시지를 전달하지 못한 경우입니다.
시각적 흐름도(Braze ✅→ 비즈뿌리오 ❌→ 수신자)로 문제를 설명하고, Platform_Api 계정으로 비즈뿌리오에 로그인하여 발송 결과를 확인하라는 안내를 제공합니다.

#### AI 연동 + 해결방안 저장
- 자동 진단이 어려운 오류: 오류 메시지 + Liquid 코드를 한 번에 복사하여 AI 서비스에 붙여넣기
- AI로 해결한 방안을 저장하면 다음에 동일 오류 발생 시 자동 제안
- **Google Sheets 연동**: 해결방안이 Google Sheets에 저장되어 팀원 간 공유 가능

### 홈화면 응원 메시지

팀원 닉네임과 응원 메시지가 5초 간격으로 페이드 애니메이션과 함께 롤링됩니다.

---

## Liquid 템플릿 출력 형식

### 버튼 X 템플릿

```liquid
{% comment %}
[알림톡(AT/AI) 템플릿 사용 방법]
1) 아래 "발송 설정" 부분만 수정하세요.
   - talk_type
     - 알림톡(텍스트): 'AT'
     - 이미지 알림톡: 'AI'
   - message_type
     - 정보성 메시지: 'info'
     - 광고성 메시지: 'ad'
   - at_template_code
     - 비즈뿌리오에 등록된 템플릿 코드 (예: 'WBC083')
   - at_message_body
     - 실제 발송할 메시지 본문 (여러 줄 입력 가능)
     - 비즈뿌리오 템플릿과 줄바꿈/공백 상이 시 발송 실패합니다.
2) 그 아래 JSON 구조(from, senderkey 등)는 수정하지 마세요.
   - from: message_type 에 따라 자동 번호 선택
     - info → 02-568-9208
     - ad → 02-554-2285
3) 발송 전 꼭 확인할 것:
   - 알림톡 타입(AT / AI)
   - 템플릿 코드(at_template_code)
   - 메시지 본문(at_message_body)
{% endcomment %}
{% comment %}
⭐️ talk_type 설정
- 알림톡(AT) 또는 이미지 알림톡(AI)
{% endcomment %}
{%- assign talk_type = 'AI' -%}
{% comment %}
⭐️ message_type 설정
- 정보성(info) / 광고성(ad)
{% endcomment %}
{%- assign message_type = 'info' -%}
{% comment %}
⭐️ 템플릿 코드 입력 (비즈뿌리오 등록 코드)
템플릿 코드는 비즈뿌리오 메세지 관리 > 카카오톡 관리 > 알림톡 템플릿 관리에서 '템플릿코드' 를 찾아 사용해주세요.
{% endcomment %}
{%- assign at_template_code = 'WBC083' -%}
{% comment %}
⭐️ 메세지 본문 입력
- 비즈뿌리오 템플릿과 동일해야 발송 성공
- 여러 줄/따옴표(") 자유 입력을 위해 capture 사용
{% endcomment %}
{%- capture at_message_body -%}
안녕하세요. "{{custom_attribute.${USER_NAME}}}"님, 월급쟁이부자들 대표 너바나 입니다.
{{custom_attribute.${USER_NAME}}}님의 월부닷컴 가입을 환영합니다.
(중략)
월부 커뮤니티에서 뵙겠습니다. 신규멤버필독!
{%- endcapture -%}
{% comment %}
=== 발송 번호 자동 설정 — 수정 불필요 ===
{% endcomment %}
{%- assign from_info = '02-568-9208' -%}
{%- assign from_ad   = '02-554-2285' -%}
{%- if message_type == 'ad' -%}
{%- assign from_number = from_ad -%}
{%- else -%}
{%- assign from_number = from_info -%}
{%- endif -%}
{% comment %}
=== 실제 API 요청 바디 (수정 금지) ===
{% endcomment %}
{
  "account": "weolbu_platform_api",
  "type": "{{ talk_type | downcase }}",
  "from": "{{ from_number }}",
  "to": "{{custom_attribute.${userPhone}}}",
  "content": {
    "{{ talk_type | downcase }}": {
      "senderkey": "45f7bb1894771fa9ef7fc6605d72474541f09515",
      "templatecode": "{{ at_template_code }}",
      "message": "{{ at_message_body | strip | json_escape }}"
    }
  },
  "refkey": "{{ 'now' | date: '%Y%m%d%H%M%S' }}_{{ random | slice: 0,6 }}"
}
```

---

## 예시 데이터

### 세트 1: 버튼 O / AT / info

| 필드 | 값 |
|------|-----|
| 템플릿 원문 | `#{강의명}의 #{쿠폰내용} 쿠폰이 오늘 밤에 마감돼요!`<br>`■ 쿠폰명: #{쿠폰이름} ■ 만료일시: #{만료일시}` |
| 발송 원문 | `<2026NEW! 서울투자 기초반>의 재수강 투자 응원 6만원 쿠폰이 오늘 밤에 마감돼요!`<br>`■ 쿠폰명: 재수강 투자 응원 6만원 쿠폰 ■ 만료일시: 01.29(목) 23:59까지` |
| 템플릿 코드 | `bizp_2025123103044120835684085` |
| 알림톡 타입 | AT |
| 메시지 유형 | info |
| 버튼명 | `자세히 보기🎁` |
| url변수 | `https://` |
| UTM | `https://weolbu.com/event?utm_source=katalk&utm_medium=alimtalk` |

### 세트 2: 버튼 X / AT / info

| 필드 | 값 |
|------|-----|
| 템플릿 원문 | `#{고객명}님의 주문이 발송되었습니다.`<br>`■ 주문번호: #{주문번호}`<br>`■ 상품명: #{상품명}`<br>`■ 택배사: #{택배사명} (#{송장번호})`<br>`■ 배송예정일: #{배송예정일}` |
| 발송 원문 | `김철수님의 주문이 발송되었습니다.`<br>`■ 주문번호: ORD-20260226-0042`<br>`■ 상품명: 월부 투자 노트 세트`<br>`■ 택배사: CJ대한통운 (629183740281)`<br>`■ 배송예정일: 02.28(금)` |
| 템플릿 코드 | `bizp_2026022601234567890123456` |
| 알림톡 타입 | AT |
| 메시지 유형 | info |

### 세트 3: 버튼 O / AI / ad (www 포함 URL)

| 필드 | 값 |
|------|-----|
| 템플릿 원문 | `#{이름}님, #{강의명} 수강생 전용 혜택!`<br>`#{쿠폰내용} 쿠폰이 도착했어요.`<br>`■ 쿠폰코드: #{쿠폰코드}`<br>`■ 만료일시: #{만료일시}` |
| 발송 원문 | `박영희님, <2026 부동산 실전반> 수강생 전용 혜택!`<br>`수강료 10만원 할인 쿠폰이 도착했어요.`<br>`■ 쿠폰코드: REAL2026-VIP`<br>`■ 만료일시: 03.31(월) 23:59까지` |
| 템플릿 코드 | `bizp_2026030103044120835612345` |
| 알림톡 타입 | AI |
| 메시지 유형 | ad |
| 버튼명 | `쿠폰 사용하기` |
| url변수 | `https://` |
| UTM | `https://www.weolbu.com/coupon?utm_source=katalk&utm_medium=alimtalk&utm_campaign=vip_coupon` |

---

## Google Sheets 연동 (오류 해결방안 공유 DB)

오류 진단 기능의 해결방안을 팀원 간 공유하기 위해 Google Sheets를 사용합니다.

> 현재 Google Sheets 연동이 설정되어 있어 바로 사용 가능합니다.
>
> **시트 바로가기**: [Google Sheets 열기](https://docs.google.com/spreadsheets/d/1obrymDag-g_XNgMXBsyVQYHzB5-l4tHCkAcnJcV-8A8/edit?gid=0#gid=0)

### 설정 방법 (재설정이 필요한 경우)

#### 1단계: Google Sheet 생성

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. **시트1**의 1행(헤더)에 아래 컬럼명 입력:

| A | B | C | D |
|---|---|---|---|
| errorPattern | description | fixedCode | savedAt |

#### 2단계: Apps Script 배포

1. 생성한 Google Sheet에서 **확장 프로그램 > Apps Script** 클릭
2. 기본 코드를 모두 지우고, 프로젝트 내 `google-apps-script/Code.gs` 파일의 내용을 전체 복사하여 붙여넣기
3. **배포 > 새 배포** 클릭
4. 유형: **웹 앱** 선택
5. 설정:
   - 실행 주체: **나**
   - 액세스 권한: **모든 사용자**
6. **배포** 클릭 → 웹 앱 URL 복사

#### 3단계: 프로젝트에 URL 설정

`src/utils/errorStore.ts` 파일의 `SHEET_CONFIG`에 복사한 URL 입력:

```typescript
const SHEET_CONFIG = {
  readUrl: 'https://script.google.com/macros/s/여기에_배포_URL/exec',
  writeUrl: 'https://script.google.com/macros/s/여기에_배포_URL/exec',
};
```

> readUrl과 writeUrl에 **동일한 URL**을 입력합니다.

#### 4단계: 빌드 및 배포

```bash
npm run build
# gh-pages 브랜치에 배포
```

---

## 프로젝트 구조

```
src/
├── App.tsx                      # 메인 레이아웃 (3단계 + 3열 구조)
├── components/
│   ├── TemplateTypeSelector.tsx  # 홈화면 카드 + 응원 메시지 롤링
│   ├── StepIndicator.tsx         # 3단계 진행 표시기
│   ├── InputForm.tsx             # Step 1 정보 입력 폼
│   ├── ResultDisplay.tsx         # Step 2 결과 표시 + 복사
│   └── ErrorDiagnoser.tsx        # 오류 진단 (standalone/connected 모드)
├── utils/
│   ├── liquidGenerator.ts        # Liquid 코드 생성 엔진
│   ├── errorDiagnoser.ts         # 오류 파싱 + 분류 + 자동 수정
│   ├── errorStore.ts             # Google Sheets 연동 (해결방안 저장/조회)
│   └── variableDict.ts           # 한글→영어 변수명 사전 (87개)
├── types/
│   └── index.ts                  # TypeScript 타입 정의
└── index.css                     # Tailwind CSS 설정
```

---

## 기술 스택

| 기술 | 버전 |
|------|------|
| React | 19.0.0 |
| TypeScript | 5.7 |
| Vite | 6.0.0 |
| Tailwind CSS | 4.0.0 |

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```
