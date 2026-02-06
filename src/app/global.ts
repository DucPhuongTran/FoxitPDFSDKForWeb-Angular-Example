export interface RichTextData {
  index?: number;
  content?: string;
  richTextStyle?: RichTextStyle;
}
interface RichTextStyle {
  font?: {
    name: string;
  }
  textSize?: number;
  textAlignment?: 0 | 1 | 2;
  textColor?: number | string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  cornerMarkStyle?: 1 | 2 | 3;
}

export interface ExtData {
  markupFontFamily: { value: string };
  textSize: number;
  textStyle: { bold: boolean; italic: boolean; underline: boolean; };
  textColor: string;
}

export interface Point {
  x: number;
  y: number;
}

declare interface AnnotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface AnnotJson {
  type: string, //"freetext",
  color: string, //"#ff0000",
  flags: string, //"print",
  date: string, //"D:20260204095225+07'00'",
  name: string, //"72be33f6-aa54-4916-8cba-f908b32de046",
  page: number, //0,
  rect: string, //"28.775087356567383,570.9342651367188,208.7335662841797,614.781982421875",
  innerRect: string, //"28.775087356567383,570.9342651367188,208.7335662841797,614.781982421875",
  contents: string, //"Test Font Arial",
  width: number, //1,
  customEntries: string, //{},
  style: string, //"solid",
  opacity: number, //1,
  creationdate: string, //"D:20260204094549+07'00'",
  subject: string, //"Textbox",
  title: string, //"{\"angle\":0,\"borderStyle\":null,\"borderInfo\":null,\"fillColor\":\"#ff0000\",\"fillType\":1,\"opacity\":1,\"lineColor\":\"#ff0000\",\"lineThickness\":1,\"lineStyle\":{\"type\":1,\"style\":0,\"dashes\":[]},\"fillOpacity\":50,\"textSize\":24,\"textColor\":\"#ff0000\",\"markupFontFamily\":{\"name\":\"Arial\",\"value\":\"arial\"},\"textStyle\":{\"bold\":true,\"italic\":true,\"underline\":true},\"rotate\":0}",
  justification: number, //0,
  defaultappearance: string, //"/FoxitSansOTF 24 Tf 1.00 0.00 0.00 rg",
  fontColor: string, //"#ff0000"
}
