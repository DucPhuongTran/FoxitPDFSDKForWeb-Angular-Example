import { Component, OnInit, ViewEncapsulation, ElementRef } from '@angular/core';
import license from './license-key';
import { WatermarkHelper } from '../watermark';
import * as UIExtension from '@foxitsoftware/foxit-pdf-sdk-for-web-library';
import { APIServiceService } from '../apiservice.service';

@Component({
  selector: 'app-foxitpdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PDFViewerComponent implements OnInit {
  pdfui: any;
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

  fileLocations = ['237121BU-WD001-350_pages.pdf', '237121BU-WD001-302_pages_interleaved.pdf', '237121BU-WD001-459_3_pages.pdf'];

  scale = 1;
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
    this.apiService.getFile(`${this.getBaseUrl()}/assets/${this.fileLocations[2]}`).subscribe(async (response: BodyInit) => {
      const buffer = await new Response(response).arrayBuffer();
      console.log('buffer ', buffer);
      console.log('response ', response);
      await this.pdfui.openPDFByFile(buffer);
    });
  }

  async testGetStream() {
    console.log('testGetStream');
    const bufferArray: ArrayBuffer[] = [];
    let pdfDoc = await this.pdfui.getCurrentPDFDoc();
    const metadata = await pdfDoc.getMetadata();
    console.log('pdfDoc ', pdfDoc);
    // await pdfDoc.getStream((e) => {
    //   bufferArray.push(e.arrayBuffer);
    //   console.log('bufferArray ', bufferArray);
    // });
    const blob = await this.example(pdfDoc);
    const blobURL = URL.createObjectURL(blob);
    window.open(blobURL);
  }

  example(pdfDoc) {
    let bufferArray = [];
    return pdfDoc.getStream(({ arrayBuffer, offset, size }) => {
      bufferArray.push(arrayBuffer);
      console.log('bufferArray ', bufferArray);
    }).then(function (size) {
      console.log('The total size of the stream', size)
      return new Blob(bufferArray, { type: 'application/pdf' });
    })
  }
  async zoom(s: number) {
    const pdfViewer = await this.pdfui.getPDFViewer();
    pdfViewer.zoomTo(this.scale += s).catch(function () { });
  }
  async Watermark() {
    const watermarkConfig = {
      "HEADER": {
        "topLeftText": "Top Left Header",
        "topCenterText": "Drawing: pdf_Sample.",
        "topRightText": "",
        "bottomLeftText": "",
        "bottomCenterText": "Date: 05/12/2025",
        "bottomRightText": "",
        "fontSize": 12,
        "disableHeaders": false
      },
      "WATERMARK": {
        "text": "New Un-Vaulted Doc  05/12/2025  16:56:26",
        "fontName": "courier",
        "fontSize": 24,
        "fontStyle": 0,
        "orientation": 0,
        "position": "center",
        "xFactor": 0.5,
        "yFactor": 0.5,
        "color": "#ff0000",
        "alpha": 1,
        "disableWatermark": false
      }
    };
    const pdfViewer = await this.pdfui.getPDFViewer();
    // await this.WatermarkHelper.setWatermarkPDFDoc(watermarkConfig, pdfViewer);
    await this.WatermarkHelper.setWatermarkAllPage(watermarkConfig, pdfViewer);
  }
  async HeaderFooter() {
    const watermarkConfig = {
      "HEADER": {
        "topLeftText": "Top Left Header",
        "topCenterText": "Drawing: pdf_Sample.",
        "topRightText": "Top Right Text",
        "bottomLeftText": "Bottom Left Text",
        "bottomCenterText": "Date: 05/12/2025",
        "bottomRightText": "Bottom Right Text",
        "fontSize": 12,
        "disableHeaders": false
      },
      "WATERMARK": {
        "text": "New Un-Vaulted Doc  05/12/2025  16:56:26",
        "fontName": "courier",
        "fontSize": 24,
        "fontStyle": 0,
        "orientation": 0,
        "position": "center",
        "xFactor": 0.5,
        "yFactor": 0.5,
        "color": "#ff0000",
        "alpha": 1,
        "disableWatermark": false
      }
    };
    const pdfViewer = await this.pdfui.getPDFViewer();
    // await this.WatermarkHelper.setWatermarkPDFDoc(watermarkConfig, pdfViewer);
    await this.WatermarkHelper.setHeaderFooter(watermarkConfig, pdfViewer);
  }
}
