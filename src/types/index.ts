export type TemplateType = 'with_button' | 'without_button';

export type TalkType = 'AT' | 'AI';
export type MessageType = 'info' | 'ad';

export interface FormData {
  templateType: TemplateType;
  templateText: string;
  sendingText: string;
  templateCode: string;
  talkType: TalkType;
  messageType: MessageType;
  buttonName: string;
  urlVariable: string;
  utm: string;
}

export interface ExtractedVariable {
  koreanName: string;
  originalPattern: string;
  matchedValue: string;
  englishName: string;
  isAutoNamed: boolean;
}

export interface ProcessingResult {
  variables: ExtractedVariable[];
  liquidCode: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  type: 'editable' | 'fixed';
  label?: string;
  description?: string;
  content: string;
}

export type ErrorType =
  | 'tab'
  | 'newline'
  | 'quote'
  | 'single_quote'
  | 'backslash'
  | 'structure'
  | 'api_error'
  | 'api_200_ok'
  | 'unknown';

export interface ChangeDetail {
  location: string;   // 어디에서 (예: "변수 'lecture_name'의 값")
  problem: string;    // 무엇이 문제 (예: "탭 문자 2개 포함")
  fix: string;        // 어떻게 수정 (예: "공백으로 치환")
}

export interface DiagnosisResult {
  errorType: ErrorType;
  description: string;
  cause: string;
  fixApplied: string;
  fixedCode: string;
  changeDetails: ChangeDetail[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  type?: 'error_input' | 'liquid_input' | 'diagnosis' | 'fix_result' | 'ai_guide' | 'info' | 'choice_prompt';
  fixedCode?: string;
  changeDetails?: ChangeDetail[];
  diagnosis?: DiagnosisResult;
  choiceButtons?: { label: string; action: string }[];
}
