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
