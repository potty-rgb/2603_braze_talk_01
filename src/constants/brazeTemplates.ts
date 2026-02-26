import type { TemplateSection } from '../types';

// 버튼 O 템플릿의 섹션 구조 정의
export function buildWithButtonSections(params: {
  talkType: string;
  messageType: string;
  templateCode: string;
  variableDefs: string;
  captureBlock: string;
  buttonBlock: string;
}): TemplateSection[] {
  return [
    {
      id: 'header-comment',
      type: 'fixed',
      content: `{% comment %}
[알림톡(AT/AI) 템플릿 사용 방법 – 버튼 포함 버전]
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
   - at_button_name / at_button_url_pc / at_button_url_mobile
     - 버튼명 및 버튼 클릭 시 이동할 PC/모바일 URL
     - 버튼 타입(type)은 웹 링크 'WL' 고정입니다.
2) 그 아래 JSON 구조(from, senderkey 등)는 수정하지 마세요.
   - from: message_type 에 따라 자동 번호 선택
     - info → 02-568-9208
     - ad → 02-554-2285
3) 발송 전 꼭 확인할 것:
   - 알림톡 타입(AT / AI)
   - 템플릿 코드(at_template_code)
   - 메시지 본문(at_message_body)
   - 버튼 정보(at_button_name / url)
{% endcomment %}`,
    },
    {
      id: 'talk-type-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ talk_type 설정
- 알림톡(AT) 또는 이미지 알림톡(AI)
{% endcomment %}`,
    },
    {
      id: 'talk-type',
      type: 'editable',
      label: '알림톡 타입',
      description: 'AT(텍스트) 또는 AI(이미지)',
      content: `{%- assign talk_type = '${params.talkType}' -%}`,
    },
    {
      id: 'message-type-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ message_type 설정
- 정보성(info) / 광고성(ad)
{% endcomment %}`,
    },
    {
      id: 'message-type',
      type: 'editable',
      label: '메시지 유형',
      description: 'info(정보성) / ad(광고성)',
      content: `{%- assign message_type = '${params.messageType}' -%}`,
    },
    {
      id: 'template-code-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ 템플릿 코드 입력 (비즈뿌리오 등록 코드)
템플릿 코드는 비즈뿌리오 메세지 관리 > 카카오톡 관리 > 알림톡 템플릿 관리에서
'템플릿코드'를 찾아 사용해주세요.
{% endcomment %}`,
    },
    {
      id: 'template-code',
      type: 'editable',
      label: '템플릿 코드',
      description: '비즈뿌리오 등록 코드',
      content: `{%- assign at_template_code = '${params.templateCode}' -%}`,
    },
    {
      id: 'variable-defs',
      type: 'editable',
      label: '변수 정의',
      description: '메시지 본문에 사용되는 변수 + link_no_proto',
      content: params.variableDefs,
    },
    {
      id: 'message-body-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ 메시지 본문 입력
- 비즈뿌리오 템플릿과 동일해야 발송 성공
{% endcomment %}`,
    },
    {
      id: 'message-body',
      type: 'editable',
      label: '메시지 본문',
      description: '변환된 Liquid 변수가 적용된 본문',
      content: params.captureBlock,
    },
    {
      id: 'button-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ 버튼 정보 입력
- 버튼 타입(type)은 우선 WL(웹링크)로 설정. 이외 필요한 링크가 있으신 경우 요청 부탁드립니다.
- 버튼명, 랜딩 URL(PC, MOBILE)
{% endcomment %}`,
    },
    {
      id: 'button-info',
      type: 'editable',
      label: '버튼 설정',
      description: '버튼명, PC/모바일 URL',
      content: params.buttonBlock,
    },
    {
      id: 'from-number',
      type: 'fixed',
      content: `{% comment %}
=== 발송 번호 자동 설정 — 수정 불필요 ===
{% endcomment %}
{%- assign from_info = '02-568-9208' -%}
{%- assign from_ad   = '02-554-2285' -%}
{%- if message_type == 'ad' -%}
{%- assign from_number = from_ad -%}
{%- else -%}
{%- assign from_number = from_info -%}
{%- endif -%}`,
    },
    {
      id: 'json-body',
      type: 'fixed',
      content: `{% comment %}
=== 실제 API 요청 바디 (수정 금지) ===
{% endcomment %}
{
  "account": "weolbu_platform_api",
  "type": "{{ talk_type | downcase }}",
  "from": "{{ from_number }}",
  "to": "{{custom_attribute.\${userPhone}}}",
  "content": {
    "{{ talk_type | downcase }}": {
      "senderkey": "45f7bb1894771fa9ef7fc6605d72474541f09515",
      "templatecode": "{{ at_template_code }}",
      "message": "{{ at_message_body | strip | json_escape }}",
      "button": [
        {
          "name": "{{ at_button_name | strip }}",
          "type": "WL",
          "url_pc": "{{ at_button_url_pc }}",
          "url_mobile": "{{ at_button_url_mobile }}"
        }
      ]
    }
  },
  "refkey": "{{ 'now' | date: '%Y%m%d%H%M%S' }}_{{ random | slice: 0,6 }}"
}`,
    },
  ];
}

// 버튼 X 템플릿의 섹션 구조 정의
export function buildWithoutButtonSections(params: {
  talkType: string;
  messageType: string;
  templateCode: string;
  variableDefs: string;
  captureBlock: string;
}): TemplateSection[] {
  return [
    {
      id: 'header-comment',
      type: 'fixed',
      content: `{% comment %}
[알림톡(AT/AI) 템플릿 사용 방법 – 버튼 미포함 버전]
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
{% endcomment %}`,
    },
    {
      id: 'talk-type-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ talk_type 설정
- 알림톡(AT) 또는 이미지 알림톡(AI)
{% endcomment %}`,
    },
    {
      id: 'talk-type',
      type: 'editable',
      label: '알림톡 타입',
      description: 'AT(텍스트) 또는 AI(이미지)',
      content: `{%- assign talk_type = '${params.talkType}' -%}`,
    },
    {
      id: 'message-type-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ message_type 설정
- 정보성(info) / 광고성(ad)
{% endcomment %}`,
    },
    {
      id: 'message-type',
      type: 'editable',
      label: '메시지 유형',
      description: 'info(정보성) / ad(광고성)',
      content: `{%- assign message_type = '${params.messageType}' -%}`,
    },
    {
      id: 'template-code-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ 템플릿 코드 입력 (비즈뿌리오 등록 코드)
템플릿 코드는 비즈뿌리오 메세지 관리 > 카카오톡 관리 > 알림톡 템플릿 관리에서
'템플릿코드'를 찾아 사용해주세요.
{% endcomment %}`,
    },
    {
      id: 'template-code',
      type: 'editable',
      label: '템플릿 코드',
      description: '비즈뿌리오 등록 코드',
      content: `{%- assign at_template_code = '${params.templateCode}' -%}`,
    },
    {
      id: 'variable-defs',
      type: 'editable',
      label: '변수 정의',
      description: '메시지 본문에 사용되는 변수',
      content: params.variableDefs,
    },
    {
      id: 'message-body-comment',
      type: 'fixed',
      content: `{% comment %}
⭐️ 메시지 본문 입력
- 비즈뿌리오 템플릿과 동일해야 발송 성공
{% endcomment %}`,
    },
    {
      id: 'message-body',
      type: 'editable',
      label: '메시지 본문',
      description: '변환된 Liquid 변수가 적용된 본문',
      content: params.captureBlock,
    },
    {
      id: 'from-number',
      type: 'fixed',
      content: `{% comment %}
=== 발송 번호 자동 설정 — 수정 불필요 ===
{% endcomment %}
{%- assign from_info = '02-568-9208' -%}
{%- assign from_ad   = '02-554-2285' -%}
{%- if message_type == 'ad' -%}
{%- assign from_number = from_ad -%}
{%- else -%}
{%- assign from_number = from_info -%}
{%- endif -%}`,
    },
    {
      id: 'json-body',
      type: 'fixed',
      content: `{% comment %}
=== 실제 API 요청 바디 (수정 금지) ===
{% endcomment %}
{
  "account": "weolbu_platform_api",
  "type": "{{ talk_type | downcase }}",
  "from": "{{ from_number }}",
  "to": "{{custom_attribute.\${userPhone}}}",
  "content": {
    "{{ talk_type | downcase }}": {
      "senderkey": "45f7bb1894771fa9ef7fc6605d72474541f09515",
      "templatecode": "{{ at_template_code }}",
      "message": "{{ at_message_body | strip | json_escape }}"
    }
  },
  "refkey": "{{ 'now' | date: '%Y%m%d%H%M%S' }}_{{ random | slice: 0,6 }}"
}`,
    },
  ];
}
