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
  pdfui: UIExtension.PDFUI;
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

  fileLocations = ['237121BU-WD001-20_pages.pdf', '237121BU-WD001-350_pages.pdf', 'comments.json', 'annots.json'];

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
    this.apiService.getFile(`${this.getBaseUrl()}/assets/${this.fileLocations[1]}`,).subscribe(async (response: BodyInit) => {
      const buffer = await new Response(response).arrayBuffer();
      console.log('buffer ', buffer);
      console.log('response ', response);
      await this.pdfui.openPDFByFile(buffer);
      this.loadAnnot();
    });
  }


  async zoom(s: number) {
    const pdfViewer = await this.pdfui.getPDFViewer();
    pdfViewer.zoomTo(this.scale += s).catch(function () { });
  }

  loadAnnot() {
    this.apiService.getFile(`${this.getBaseUrl()}/assets/${this.fileLocations[2]}`).subscribe(async (response: Blob) => {
      console.log('response ', response);
      const text = await response.text(); // hoặc response.arrayBuffer()
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
      let pdfDoc = await this.pdfui.getCurrentPDFDoc();
      pdfDoc.importAnnotsFromJSON(json);
    });
  }
  public async canvasToUnit8(canvas: HTMLCanvasElement): Promise<Uint8Array> {
    // Util.setDPI(canvas, SystemConstants.CANVAS_DPI);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer))).catch(reject);
        } else {
          resolve(null);
        }
      });
    });
  }
  public delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  public isCanvasEmpty(canvas) {
    const context = canvas.getContext('2d');
    if (!context) {
      console.error("Canvas's 2D Context can not be taken.");
      return true;
    }
    // [09092025][phuong_td][ADV-8241] added canvas size check
    const { width, height } = canvas;
    if (width === 0 && height === 0) return true;
    const imageData = context.getImageData(0, 0, width, height).data;
    for (let i = 3; i < imageData.length; i += 4) {
      // Check the Alpha channel of Pixel
      if (imageData[i] !== 0) {
        return false;
      }
    }
    return true;
  }
  async waitForRenderAnnots(pageRender) {
    let maxWaitTime = 5000; // Maximum waiting time
    let waitTime = 500; // Waiting time depends on conditions
    if (typeof maxWaitTime !== 'number') {
      maxWaitTime = parseFloat(maxWaitTime);
    }
    if (typeof waitTime !== 'number') {
      waitTime = parseFloat(waitTime);
    }
    let elapsedTime = 0;
    let annotCanvas = pageRender?.$ui?.[0]?.getElementsByClassName('annotRenderers');
    // [09092025][phuong_td][ADV-8241] added canvas size check
    let width = 0;
    let height = 0;
    // [20/08/2025][phuong_td][ADV-8291][ADV-8292] Wait for Canvas Annots Render Init
    while ((!annotCanvas || annotCanvas.length === 0) && elapsedTime <= maxWaitTime) {
      await this.delay(waitTime);
      elapsedTime += waitTime;
      console.warn(`Canvas render Annot has not been created, waiting for ${elapsedTime}ms...`);
      annotCanvas = pageRender?.$ui?.[0]?.getElementsByClassName('annotRenderers');
    }
    let canvas = annotCanvas[0] as HTMLCanvasElement;
    if (!canvas) {
      console.error('There is no canvas render annot');
      return;
    }
    // [20/08/2025][phuong_td][ADV-8291][ADV-8292] Wait for Annot Render on Canvas
    let isCanvasEmpty = this.isCanvasEmpty(canvas);
    if (isCanvasEmpty) {
      elapsedTime = 0;
      do {
        await this.delay(waitTime);
        elapsedTime += waitTime;
        console.warn(`Canvas is still empty, waiting for ${elapsedTime}ms...`);
        canvas = annotCanvas[0] as HTMLCanvasElement;
        isCanvasEmpty = this.isCanvasEmpty(canvas);
      } while (isCanvasEmpty && elapsedTime <= maxWaitTime)
    }
    if (isCanvasEmpty) {
      console.error('Canvas is still empty after max wait time');
    }
  }
  public waitForTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async addScreen() {
    console.log('getImageAnnots');
    let pdfDoc = await this.pdfui.getCurrentPDFDoc();
    const pageCount = pdfDoc.getPageCount();

    const pdfViewer = this.pdfui as any;
    const devicePosition = await pdfViewer.getDeviceCurrentPosition();
    const pdfDocRender = await pdfViewer.getPDFDocRender();
    let curindex = pdfDocRender.getCurrentPageIndex();
    const imageAnnots = [];
    for (let i = 0; i < pageCount; i++) {
      let position = { x: devicePosition.left, y: devicePosition.top };
      if (curindex !== i) {
        await pdfDocRender.goToPage(i, position, false);
        await pdfViewer.zoomTo('fitHeight');
      }

      const pageRender = await pdfViewer.getPDFPageRender(i);
      const page = await pageRender?.getPDFPage() as UIExtension.PDFViewCtrl.PDF.PDFPage;
      const annots = await page.getAnnots() as any[];
      const markups = annots.filter(a => a.info.isMarkup);
      if (markups.length === 0) continue;
      await this.waitForRenderAnnots(pageRender);
      const annotCanvas = pageRender.$ui[0].getElementsByClassName('annotRenderers');
      let imgData;
      if (annotCanvas && annotCanvas.length > 0) {
        const canvas = annotCanvas[0] as HTMLCanvasElement;
        imgData = await this.canvasToUnit8(canvas);
        // if (!imgData) continue;
      }
      const rdRt = pageRender?.getRotation();
      const pgRt = page?.getRotationAngle();
      // eslint-disable-next-line no-mixed-operators
      let rtArg = ((pgRt + rdRt) % 360 + 360) % 360;
      rtArg !== 0 && (rtArg = (360 - rtArg) % 360);
      const rotate = {
        0: 0,
        90: 1,
        180: 2,
        270: 3,
      }[rtArg];
      await page.removeAllAnnot();
      const a: any = {
        flags: 4 | 64,
        type: 'screen',
        rect: {
          left: 0,
          top: page.getHeight(),
          right: page.getWidth(),
          bottom: 0
        },
        borderInfo: {
          width: 0,
        },
        color: '16777215', // boderColor #FFFFFF00
        rotate,
        buffer: imgData,
      };
      imageAnnots.push({
        page, position, index: i, imgAnnot: a
      });
      await page.addAnnot(a);
    }
    console.log(imageAnnots);
    const addPromise = [];
    const breakindex = 20;
    // for (let i = 0; i < imageAnnots.length; i++) {
    //   if (i > breakindex) break;
    //   const { imgAnnot, page, position, index } = imageAnnots[i];
    //   const annotCustom = Object.assign(imgAnnot, { isCustomAdd: true });
    //   await pdfDocRender.goToPage(index, position, false);
    //   await pdfViewer.zoomTo('fitHeight');
    //   await page.addAnnot(annotCustom)
    // }
    // await Promise.race([ // waitting all 'addPromise' or 5s
    //   Promise.all(addPromise),
    //   this.waitForTimeout(5000),
    // ]);
  }
}
