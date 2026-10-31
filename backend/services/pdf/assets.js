const fs = require("fs");
const path = require("path");

const imagesDir = path.resolve(__dirname, "../../public/images");

function loadDataUri(filename, mimeType) {
  try {
    const filePath = path.join(imagesDir, filename);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error(`Failed to load asset ${filename}:`, err.message);
  }
  return "";
}

// Pre-load all required image assets into memory as Base64 Data URIs
const assets = {
  jsb: loadDataUri("jsb.png", "image/png"),
  checked: loadDataUri("checked.png", "image/png"),
  unchecked: loadDataUri("unchecked.png", "image/png"),
  logo: loadDataUri("logo.png", "image/png"),
  laxmi: loadDataUri("laxmi.jpeg", "image/jpeg"),
};

module.exports = assets;
