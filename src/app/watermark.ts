export class WatermarkHelper {
  StandardFont = {
    courier: 0,
    courierBold: 1,
    courierBoldOblique: 2,
    courierOblique: 3,
    helvetica: 4,
    helveticaBold: 5,
    helveticaBoldOblique: 6,
    helveticaOblique: 7,
    timesRoman: 8,
    timesBold: 9,
    timesBoldItalic: 10,
    timesItalic: 11,
    symbol: 12,
    zapfDingbats: 13,
  };
  WatermarkFlag = {
    asContent: 0,
    asAnnot: 1,
    onTop: 2,
    unprintable: 4,
    display: 8,
  };
  mapStandardFont = new Map([
    [
      "courier",
      new Map([
        [0, this.StandardFont.courier],
        [1, this.StandardFont.courierBold],
        [2, this.StandardFont.courierBoldOblique],
        [3, this.StandardFont.courierOblique],
      ]),
    ],
    [
      "helvetica",
      new Map([
        [0, this.StandardFont.helvetica],
        [1, this.StandardFont.helveticaBold],
        [2, this.StandardFont.helveticaBoldOblique],
        [3, this.StandardFont.helveticaOblique],
      ]),
    ],
    [
      "times",
      new Map([
        [0, this.StandardFont.timesRoman],
        [1, this.StandardFont.timesBold],
        [2, this.StandardFont.timesBoldItalic],
        [3, this.StandardFont.timesItalic],
      ]),
    ],
    ["symbol", new Map([[0, this.StandardFont.symbol]])],
    ["zapfdingbats", new Map([[0, this.StandardFont.zapfDingbats]])],
  ]);
  async getPdfPage(pdfViewer, pageIndex) {
    const pdfPage = await pdfViewer.getPDFPageRender(pageIndex)?.getPDFPage();
    return pdfPage;
  }
  ScaleValueByHeight(scale, height, isRounding) {
    if (!isRounding) return (scale * height) / 100; // không làm tròn
    return Math.ceil((scale * height) / 100);
  }
  changePositionWaterMarkPdf(xFactor, yFactor) {
    if (xFactor === 0) {
      if (yFactor === 0) return "TopLeft";
      if (yFactor === 0.5) return "CenterLeft";
      return "BottomLeft";
    }
    if (xFactor === 0.5) {
      if (yFactor === 0) return "TopCenter";
      if (yFactor === 0.5) return "Center";
      return "BottomCenter";
    }
    if (xFactor === 1) {
      if (yFactor === 0) return "TopRight";
      if (yFactor === 0.5) return "CenterRight";
      return "BottomRight";
    }
    return "TopLeft";
  }

  getFontOrientation(orientation) {
    let rotate = 0;
    if (orientation === 0) rotate = -45;
    if (orientation === 2) rotate = 90;
    return rotate;
  }
  getStandardFont(watermarkConfig) {
    try {
      const fontName = this.mapStandardFont.get(
        watermarkConfig.fontName?.replace(/\s+/g, "").toLowerCase()
      );
      if (fontName) {
        const res = fontName.get(watermarkConfig.fontStyle);
        return res || fontName.get(0);
      }
      return this.StandardFont.courier;
    } catch (e) {
      console.error(e.message);
      return this.StandardFont.courier;
    }
  }
  convertWatermark(watermarkConfig, height) {
    const defaultColor = 0xff0000;
    const color = watermarkConfig.color
      ? parseInt(watermarkConfig.color.substring(1), 16)
      : defaultColor;
    const rotation = -this.getFontOrientation(watermarkConfig.orientation);
    let opacity = watermarkConfig.alpha * 100;
    if (opacity > 100) opacity = 100;
    else if (opacity < 0) opacity = 0;
    const watermarkSettings = {
      position: this.changePositionWaterMarkPdf(
        watermarkConfig.xFactor,
        watermarkConfig.yFactor
      ), // Bị limit any position
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation,
      opacity,
      flags: this.WatermarkFlag.asAnnot,
    };
    const font = watermarkConfig
      ? this.getStandardFont(watermarkConfig)
      : this.StandardFont.courier;
    const watermarkTextProperties = {
      font, // Bị limit font family
      fontSize: this.ScaleValueByHeight(
        2.8,
        height, false
      ),
      color,
      fontStyle: "normal", // Bị limit font style
    };
    const watermark = {
      type: "text",
      useRelativeScale: false,
      text: watermarkConfig.text,
      watermarkSettings,
      watermarkTextProperties,
    };
    return watermark;
  }

  //#region Watermark
  async setWatermarkAllPage(watermarkConfig, pdfViewer) {
    if (!watermarkConfig) return;
    const start = Date.now();
    if (watermarkConfig.WATERMARK.disableWatermark !== true) {
      const pdfDoc = await pdfViewer.getCurrentPDFDoc();
      const pageCount = pdfDoc.getPageCount();
      const pageGroups = new Map();

      for (let i = 0; i < pageCount; i++) {
        const pdfPage = await this.getPdfPage(pdfViewer, i);
        const height = pdfPage.getHeight();
        const sizeKey = `${height}`;

        if (!pageGroups.has(sizeKey)) {
          pageGroups.set(sizeKey, []);
        }
        pageGroups.get(sizeKey).push(i);
      }

      const promises = [];
      const count = pageGroups.size;
      console.log('pageGroups: ', pageGroups);
      for (const [sizeKey, pageIndexes] of pageGroups.entries()) {
        const height = parseFloat(sizeKey);
        const watermark = this.convertWatermark(watermarkConfig.WATERMARK, height);

        let startPage = pageIndexes[0];
        for (let j = 1; j <= pageIndexes.length; j++) {
          if (j === pageIndexes.length || pageIndexes[j] !== pageIndexes[j - 1] + 1) {
            watermark["pageStart"] = startPage;
            watermark["pageEnd"] = pageIndexes[j - 1];
            console.log('set watermark: ', startPage, pageIndexes[j - 1]);
            // promises.push(pdfDoc.addWatermark(watermark));
            await pdfDoc.addWatermark(watermark)
            if (j < pageIndexes.length) {
              startPage = pageIndexes[j];
            }
          }
        }
      }

      // await Promise.all(promises);
    }
    const end = Date.now();
    console.log(`setWatermarkAllPage finish: ${(end - start) / 1000} s`);
  }

  //#endregion

  //#region Header Footer
  async setHeaderFooter(watermarkConfig, pdfViewer, doc?) {
    if (!watermarkConfig) return;
    if (watermarkConfig.HEADER.disableHeaders !== true) {
      let pdfDoc = null;
      if (!doc) {
        pdfDoc = pdfViewer.getCurrentPDFDoc();
      } else {
        pdfDoc = doc;
      }
      const pageCount = pdfDoc.getPageCount();
      // [27/11/2024][phuong_td] Adjust the interface to foxit PDFPage
      const listPromise:Promise<any>[] = [];
      for (let i = 0; i < pageCount; i += 1) {
        const pr = pdfDoc.getPageByIndex(i);
        listPromise.push(pr);
      }
      let totalHeight = 0;
      let count = 0;
      await Promise.all(listPromise).then((pages) => {
        pages?.length > 0 && pages.forEach((p) => {
          if (p) {
            count += 1;
            totalHeight += p.getHeight();
          }
        });
      });
      if (count > 0) {
        const pdfHeight = totalHeight / count;
        const headerFooter = this.convertHeaderFooter(watermarkConfig.HEADER, pdfHeight < 10 ? 10 : pdfHeight);
        try {
          await pdfDoc.addHeaderFooter({ json: headerFooter, isEmpty: () => false });
        } catch (error) {
          console.log('addHeaderFooter: ', error);
        }
      }
    }
  }

  calSizeText(str: string, size: number) {
    let boundingBox = null;
    const textMeasure = document.getElementById('id-cal-size-text');
    if (textMeasure) {
      textMeasure.style.fontSize = `${size}px`;
      textMeasure.textContent = str;
      boundingBox = textMeasure.getBoundingClientRect();
    }
    if (boundingBox) { return { x: boundingBox.width, y: boundingBox.height }; }
    return { x: size, y: size };
  }

  convertHeaderFooter(header, height: number) {
    const initHeaderFooter = this.createHeaderFooter();
    const contents = {
      TopLeft: header.topLeftText,
      TopRight: header.topRightText,
      TopCenter: header.topCenterText,
      BottomLeft: header.bottomLeftText,
      BottomRight: header.bottomRightText,
      BottomCenter: header.bottomCenterText,
    };
    let fontSize = header.fontSize ?? 12;
    if (fontSize <= 0) fontSize = 12;
    const newFontSize = this.ScaleValueByHeight(1.2, height, false);
    const sz = this.calSizeText('AA', newFontSize);
    const headerFooter = {
      ...initHeaderFooter,
      contents,
      textSize: newFontSize,
      margin: {
        left: 5,
        right: 5,
        top: sz.y + 5,
        bottom: sz.y + 5,
      },
    };
    return headerFooter;
  }

  public createHeaderFooter() {
    const contentFormats = {
      TopLeft: null,
      TopRight: null,
      TopCenter: null,
      BottomLeft: null,
      BottomRight: null,
      BottomCenter: null,
    };
    const contents = {
      TopLeft: '',
      TopRight: '',
      TopCenter: '',
      BottomLeft: '',
      BottomRight: '',
      BottomCenter: '',
    };
    const headerFooter = {
      contents,
      contentFormats,
      margin: {
        left: 10, right: 10, top: 20, bottom: 20,
      },
      textSize: 12,
      textColor: 0x000000, // black
      hasTextShrinked: false,
      hasFixedSized: true,
      startPageNumber: 1,
      underline: false,
      font: this.StandardFont.timesRoman,
    };
    return headerFooter;
  }
  //#endregion
}
