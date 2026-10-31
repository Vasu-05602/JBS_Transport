const path = require("path");
const pdfmake = require("pdfmake");

let fontsInitialized = false;

function initPdfFonts() {
  if (fontsInitialized) return;

  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy(() => true);

  const robotoBase = path.resolve(__dirname, "../../node_modules/@fontsource/roboto/files");
  const tinosBase = path.resolve(__dirname, "../../node_modules/@fontsource/tinos/files");
  const notoBase = path.resolve(__dirname, "../../node_modules/@fontsource/noto-sans-devanagari/files");

  pdfmake.setFonts({
    Roboto: {
      normal: path.join(robotoBase, "roboto-latin-400-normal.woff"),
      bold: path.join(robotoBase, "roboto-latin-700-normal.woff"),
      italics: path.join(robotoBase, "roboto-latin-400-italic.woff"),
      bolditalics: path.join(robotoBase, "roboto-latin-700-italic.woff"),
    },
    Times: {
      normal: path.join(tinosBase, "tinos-latin-400-normal.woff"),
      bold: path.join(tinosBase, "tinos-latin-700-normal.woff"),
      italics: path.join(tinosBase, "tinos-latin-400-italic.woff"),
      bolditalics: path.join(tinosBase, "tinos-latin-700-italic.woff"),
    },
    NotoSansDevanagari: {
      normal: path.join(notoBase, "noto-sans-devanagari-devanagari-400-normal.woff"),
      bold: path.join(notoBase, "noto-sans-devanagari-devanagari-700-normal.woff"),
    },
  });

  fontsInitialized = true;
}

module.exports = { initPdfFonts };
