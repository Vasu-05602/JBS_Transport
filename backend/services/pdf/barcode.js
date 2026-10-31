const bwipjs = require("bwip-js");

/**
 * Generate in-memory CODE128 barcode as Base64 data URI
 * @param {string} text - Barcode payload
 * @param {object} [options]
 * @returns {Promise<string>}
 */
async function generateBarcodeDataUri(text, options = {}) {
  if (!text || String(text).trim() === "") {
    return null;
  }

  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: String(text).trim(),
      scale: options.scale || 2,
      height: options.height || 8,
      includetext: options.includetext !== false,
      textsize: options.textsize || 9,
      textxalign: "center",
      backgroundcolor: "ffffff",
    });

    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Barcode generation error:", err.message);
    return null;
  }
}

module.exports = { generateBarcodeDataUri };
