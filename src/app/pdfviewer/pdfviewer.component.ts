import { Component, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import license from './license-key';
import { WatermarkHelper } from '../watermark';
import * as UIExtension from '@foxitsoftware/foxit-pdf-sdk-for-web-library';
import { APIServiceService } from '../apiservice.service';
import { RichTextData, ExtData, AnnotJson } from '../global';
import Util from '../util';
import { renderers, annotCompontents, constants } from '@foxitsoftware/foxit-pdf-sdk-for-web-library/lib/PDFViewCtrl';
import { __internal__ } from '@foxitsoftware/foxit-pdf-sdk-for-web-library/lib';
import { firstValueFrom } from 'rxjs';
type AnnotRender = renderers.annotsRender.AnnotRender;
type AnnotComponent = annotCompontents.AnnotComponent;

@Component({
  selector: 'app-foxitpdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PDFViewerComponent implements OnInit {
  private baseHref = document.baseURI;
  public pdfui: __internal__.PDFUI | undefined;
  WatermarkHelper = new WatermarkHelper();
  pdfInitTemplate = [
    '<webpdf>',
    ' <toolbar>',
    ' <tabs hidden>',
    ' <tab>',
    ' <div class="flex" style="display: flex;">',
    ' <create-textbox-ribbon-button></create-textbox-ribbon-button>',
    ' <create-text-highlight-ribbon-button></create-text-highlight-ribbon-button>',
    ' <create-callout-ribbon-button></create-callout-ribbon-button>',
    ' <create-pencil-ribbon-button></create-pencil-ribbon-button>',
    ' <create-attachment-ribbon-button></create-attachment-ribbon-button>',
    ' <create-strikeout-ribbon-button></create-strikeout-ribbon-button>',
    ' <create-underline-ribbon-button></create-underline-ribbon-button>',
    ' <create-squiggly-ribbon-button></create-squiggly-ribbon-button>',
    ' <create-replace-ribbon-button></create-replace-ribbon-button>',
    ' <create-caret-ribbon-button></create-caret-ribbon-button>',
    ' <create-note-ribbon-button></create-note-ribbon-button>',
    ' <create-drawings-ribbon-dropdown></create-drawings-ribbon-dropdown>',
    ' <create-area-highlight-ribbon-button></create-area-highlight-ribbon-button>',
    ' <create-distance-ribbon-button></create-distance-ribbon-button>',
    ' <create-measure-dropdown> </create-measure-dropdown>',
    ' <create-measure-ribbon-dropdown> </create-measure-ribbon-dropdown>',
    ' <stamp-ribbon-dropdown></stamp-ribbon-dropdown>',
    ' <hand-button></hand-button>',
    ' <hand-ribbon-button></hand-ribbon-button>',
    ' <marquee-tool-button></marquee-tool-button>',
    ' <selection-button></selection-button>',
    ' </div>',
    ' </tab>',
    ' </tabs>',
    ' </toolbar>',
    '<continuous-page-ribbon-button style="display: none" @controller="pagemode:ContinuousPageModeController"></continuous-page-ribbon-button>',
    '<xbutton style="display: none" @controller="pagemode:ContinuousPageModeController"></xbutton>',
    ` <tooltip-layer name="fv--text-selection-tooltip" class="fv--ui-text-selection-tooltip">
          <xbutton @controller="text-sel:CopySelectedTextController" icon-class="fv__icon-popup-copy"></xbutton>
      </tooltip-layer>`,
    ' <viewer ></viewer>',
    '</webpdf>',
  ];

  fileLocations = ['237121BU-WD001-350_pages.pdf', '237121BU-WD001-302_pages_interleaved.pdf', '237121BU-WD001-459_3_pages.pdf', 'Blank.pdf'];
  fonts = [
    { label: 'Arial', value: 'arial' },
    { label: 'Courier', value: 'courier' },
    { label: 'Palatino', value: 'palatino' },
    { label: 'Times New Roman', value: 'timesnewroman' },
    { label: 'Trebuchet MS', value: 'trebuchet' },
    { label: 'Verdana', value: 'verdana' },
    { label: 'Script MT Bold', value: 'scriptmtbold' },
  ];

  ritchTextFormat: ExtData = {
    markupFontFamily: { value: 'arial' },
    textSize: 24,
    textStyle: { bold: false, italic: false, underline: false },
    textColor: '#FF0000',
  };

  scale = 1;

  annotJson: __internal__.IAnnotationSummary[] = [];

  constructor(
    private element: ElementRef,
    public apiService: APIServiceService
  ) { }

  getBaseUrl() {
    const baseUrl = window.location.origin;
    console.log('Base URL:', baseUrl);
    return baseUrl;
  }


  ngOnInit() {
    const element = document.getElementById('viewer');
    // Load license from JSON file

    this.pdfui = new UIExtension.PDFUI({
      viewerOptions: {
        libPath: '/foxit-lib',
        defaultViewMode: 'continuous-view-mode',
        fragments: [{
          target: 'continuous-page',
          config: { callback: UIExtension.controllers.ContinuousPageModeController },
        }],
        jr: {
          ...license,
          fontPath: this.getBaseUrl() + '/assets/external/brotli/'
        },
      },
      appearance: UIExtension.appearances.adaptive,
      // template: this.pdfInitTemplate.join(''),
      renderTo: this.element.nativeElement,
      addons: '/foxit-lib/uix-addons/allInOne.js'
    });

    this.openFile();
  }
  async openFile() {
    this.apiService.getFile(`${this.getBaseUrl()}/assets/${this.fileLocations[3]}`).subscribe(async (response: BodyInit) => {
      const buffer = await new Response(response).arrayBuffer();
      console.log('buffer ', buffer);
      console.log('response ', response);
      if (this.pdfui) {
        await this.pdfui.openPDFByFile(buffer);
        await this.setupFont();
        this.importAnnotsFromJSON();
        const pdfViewer = await this.pdfui.getPDFViewer();
        pdfViewer.getEventEmitter().on('active-annotation', (annotRenders: Array<__internal__.AnnotRender>) => {
          //do something
          console.log('annotRenders ', annotRenders);
        })
      }
    });
  }
  async setupFont() {
    if (this.pdfui) {
      const pdfViewer = await this.pdfui.getPDFViewer();
      pdfViewer.setJRFontMap(this.getFontMappings());
    }
  }
  /**
   * Retrieves the font mappings used for PDF rendering.
   */
  private getFontMappings() {
    const path = `${this.baseHref}assets/font`;
    console.log(`${path}/arial/arial.ttf`)
    return [
      {
        nameMatches: [/(arial)|(arialbold)|(arialoblique)/i],
        glyphs: [
          { bold: -1, flags: 0x80000, isBrotli: false, url: `${path}/arial/arial.ttf` },
          { bold: 0x1f0, flags: 0x80000, isBrotli: false, url: `${path}/arial/arialbd.ttf` },
        ],
        charsets: [0],
      },
      {
        nameMatches: [/ArialNarrow| arialnarrow_bold | arialnarrow_bolditalic | arialnarrow_italic/i],
        glyphs: [
          { bold: 0x1f0, flags: -1, isBrotli: false, url: `${path}/ArialNarrow/arialnarrow.ttf` },
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/ArialNarrow/arialnarrow_bold.ttf` },
          { bold: 0x1f0, flags: 0x0040, isBrotli: false, url: `${path}/ArialNarrow/arialnarrow_bolditalic.ttf` },
          { bold: -1, flags: 0x0040, isBrotli: false, url: `${path}/ArialNarrow/arialnarrow_italic.ttf` },
        ],
      },
      {
        nameMatches: [/CenturyGothic/i],
        glyphs: [
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/CenturyGothic/centurygothic.ttf` },
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/CenturyGothic/centurygothic_bold.ttf` },
        ],
      },
      {
        nameMatches: [/Script MT|Script MT Bold/i],
        glyphs: [
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/scriptmtbold/ScriptMTBold.ttf` },
        ],
      },
      {
        nameMatches: [/palatino|palatinobd|palatinobi|palatinoi/i],
        glyphs: [
          { bold: 0x1f0, flags: -1, isBrotli: false, url: `${path}/palatino/palatino.ttf` },
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/palatino/palatinobd.ttf` },
          { bold: 0x1f0, flags: 0x0040, isBrotli: false, url: `${path}/palatino/palatinobi.ttf` },
          { bold: -1, flags: 0x0040, isBrotli: false, url: `${path}/palatino/palatinoi.ttf` },
        ],
        charsets: [0],
      },
      {
        nameMatches: [/trebuchet|trebuchetbd|trebuchetbi|trebucheti/i],
        glyphs: [
          { bold: 0x1f0, flags: -1, isBrotli: false, url: `${path}/trebuchet/trebuchet.ttf` },
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/trebuchet/trebuchetbd.ttf` },
          { bold: 0x1f0, flags: 0x0040, isBrotli: false, url: `${path}/trebuchet/trebuchetbi.ttf` },
          { bold: -1, flags: 0x0040, isBrotli: false, url: `${path}/trebuchet/trebucheti.ttf` },
        ],
        charsets: [0],
      },
      {
        nameMatches: [/verdana|verdanabd|verdanabi|verdanai/i],
        glyphs: [
          { bold: 0x1f0, flags: -1, isBrotli: false, url: `${path}/verdana/verdana.ttf` },
          { bold: -1, flags: -1, isBrotli: false, url: `${path}/verdana/verdanabd.ttf` },
          { bold: 0x1f0, flags: 0x0040, isBrotli: false, url: `${path}/verdana/verdanabi.ttf` },
          { bold: -1, flags: 0x0040, isBrotli: false, url: `${path}/verdana/verdanai.ttf` },
        ],
        charsets: [0],
      },
    ];
  }
  async zoom(s: number) {
    if (this.pdfui === undefined) {
      return;
    }
    const pdfViewer = await this.pdfui.getPDFViewer();
    pdfViewer.zoomTo(this.scale += s).catch(function () { });
  }
  public async importAnnotsFromJSON() {
    if (this.pdfui === undefined) {
      return;
    }
    const response = await firstValueFrom(this.apiService.getFile(`${this.getBaseUrl()}/assets/comments.json`));
    if (this.pdfui === undefined) {
      return;
    }
    const json = await new Response(response).json();
    const pdfViewer = await this.pdfui.getPDFViewer();
    const curPDFDoc = await pdfViewer.getCurrentPDFDoc();
    this.annotJson = Array.isArray(json) ? json : (json?.annots ?? json?.data ?? json);
    if (curPDFDoc && this.annotJson && this.annotJson.length > 0) {
      await curPDFDoc.importAnnotsFromJSON(this.annotJson);
      console.log('importAnnotsFromJSON: ', this.annotJson?.length ?? 0);
      let annots = await curPDFDoc.getAnnots() as any[];
      const pageRender = await pdfViewer.getPDFPageRender(0);
      if (pageRender) {
        for (let index = 0; index < this.annotJson.length; index++) {
          const element = this.annotJson[index];
          // console.log('element ', element);
          const { title, name } = element as any;
          const annot = annots[0].find((a: any) => a.info?.name === name);
          if (!annot) {
            continue;
          }
          const annotsRender = pageRender.getAnnotRender(annot.getUniqueID()) as AnnotRender;
          this.handleRichTextFormat(title ?? '', annotsRender);
        }
      }
    }
  }

  async setFormat(type: string, value?: string) {
    if (this.pdfui === undefined) {
      return;
    }
    console.log('setFormat ', type);
    const pdfViewer = await this.pdfui.getPDFViewer();
    let pdfDoc = await this.pdfui.getCurrentPDFDoc();
    const pageRender = await pdfViewer.getPDFPageRender(0);
    if (pdfDoc && pageRender) {
      let page = await pdfDoc.getPageByIndex(0);
      let annots = await page.getAnnots();
      console.log('annots ', annots);

      const { activationManager } = pdfViewer as any;
      console.log('activationManager ', activationManager);
      for (let annot of annots) {
        console.log(annot);
        // const {name} = annot.info;
        const annotsRender = pageRender.getAnnotRender(annot.getUniqueID()) as AnnotRender;
        const component = (annotsRender as any).component as AnnotComponent;
        console.log(annotsRender, component);
        switch (type) {
          case 'B':
            this.ritchTextFormat.textStyle.bold = !this.ritchTextFormat.textStyle.bold;
            break;
          case 'U':
            this.ritchTextFormat.textStyle.underline = !this.ritchTextFormat.textStyle.underline;
            break;
          case 'I':
            this.ritchTextFormat.textStyle.italic = !this.ritchTextFormat.textStyle.italic;
            break;
          case 'font':
            this.ritchTextFormat.markupFontFamily.value = value ?? this.ritchTextFormat.markupFontFamily.value;
            console.log('font ', this.ritchTextFormat.markupFontFamily.value);
            break;
          default:
            break;
        }
        const { name } = (annot as any).info;
        const isActive = activationManager.currentActivatable.activations.find((aRender: any) => aRender.annot.info.name === name)
        if (isActive) {
          this.setFormatText({
            ...this.ritchTextFormat,
          }, 24, component, annotsRender, annot);
        }
      }
    }
  }

  // [19/12/2024] [hao_lt] update format annot when init data.
  public async handleRichTextFormat(rawTitle: string, annotRender: __internal__.AnnotRender) {
    if (rawTitle !== 'Foxit Web') {
      const parsedTitleData = JSON.parse(rawTitle);
      const annotationContent = await (annotRender as any).annot.getContent();
      const existingRichTextData = await (annotRender as any).annot.getRichText();

      if (!existingRichTextData?.length && annotationContent.length) {
        const defaultRichTextStyle = {
          font: { name: parsedTitleData?.markupFontFamily?.value || '' },
          textSize: parsedTitleData.textSize,
          textAlignment: 0,
          textColor: Util.hexadecimalToNumber(parsedTitleData.textColor),
          isBold: parsedTitleData.textStyle.bold,
          isItalic: parsedTitleData.textStyle.italic,
          isUnderline: parsedTitleData.textStyle.underline,
          cornerMarkStyle: 1,
        };
        const richTextData: any[] = [{ content: annotationContent, richTextStyle: defaultRichTextStyle }];
        console.log('\n =========\nrichTextData ', richTextData)
        await (annotRender as any).annot.addRichText(richTextData);
        const json = (annotRender as any).annot.exportToJSON();
        console.log('annot ', annotationContent, (annotRender as any).annot, json);
      }
    }
  }

  public async setFormatText(curExtData: ExtData, Sizetext: number, annotComponent: AnnotComponent, annotRender: AnnotRender, annot: __internal__.Annot) {
    const contents = await annot.getContent();
    const curRichText = await (annot as any).getRichText();
    console.log(curRichText)
    // {
    //   "textSize": 24,
    //     "textAlignment": 0,
    //       "textColor": 16711680,
    //         "isBold": false,
    //           "isItalic": false,
    //             "isUnderline": false,
    //               "isStrikethrough": false,
    //                 "cornerMarkStyle": 1,
    //                   "fontName": "Helvetica"
    // }
    const richTextData: RichTextData[] = [
      {
        index: 0,
        content: contents,
        richTextStyle: {
          font: {
            name: curExtData.markupFontFamily.value,
          },
          textSize: Sizetext,
          textAlignment: 0,
          textColor: Util.hexadecimalToNumber(curExtData?.textColor),
          isBold: curExtData.textStyle.bold,
          isItalic: curExtData.textStyle.italic,
          isUnderline: curExtData.textStyle.underline,
          cornerMarkStyle: 1,
        },
      },
    ];

    const dataRichText = await (annot as any).getRichText();
    if (dataRichText && dataRichText.length === 0 && Sizetext) {
      await (annot as any).addRichText(richTextData);
    } else {
      await (annot as any).setRichText(richTextData);
    }
    const json = annot.exportToJSON();
    console.log('annot ', annot);
    console.log('annot data: ', json);
  }
}
