const fs = require("fs");
const JSZip = require("jszip");

/**
 * Parses and validates Word document files (.docx and .doc).
 *
 * Differences from Excel (.xlsx/.xls):
 * 1. File Structure:
 *    - Word .docx is an OpenXML ZIP package containing `word/document.xml` where text
 *      is structured inside paragraphs `<w:p>`, runs `<w:r>`, and text nodes `<w:t>`.
 *    - Word .doc is a legacy OLE2 / Compound File Binary Format starting with magic
 *      bytes [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1].
 * 2. Emptiness & Content Validation:
 *    - In addition to checking for 0-byte file size, Word documents are inspected to
 *      ensure the document structure is valid and contains readable text content.
 *    - Document metrics such as word count and paragraph count are extracted.
 *
 * @param {string} filePath - Absolute path to uploaded file on disk.
 * @param {string} originalFilename - Original filename of the uploaded file.
 * @returns {Promise<{wordCount: number, paragraphCount: number, textPreview: string}>}
 */
async function parseWordDocument(filePath, originalFilename) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found on disk for validation.");
  }

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new Error("The uploaded Word document is empty (0 bytes).");
  }

  const ext = originalFilename.split(".").pop().toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === "docx") {
    // Check for ZIP magic bytes (PK\x03\x04 or PK\x05\x06)
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new Error(
        "Invalid Word document: File is not a valid .docx (corrupt or incorrect format)."
      );
    }

    let zip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (err) {
      throw new Error(
        `Failed to parse .docx archive: ${err.message || "Corrupt ZIP structure"}`
      );
    }

    const docFile = zip.file("word/document.xml");
    if (!docFile) {
      throw new Error(
        "Invalid Word document: Missing word/document.xml inside archive."
      );
    }

    const xml = await docFile.async("string");

    // Extract text inside <w:t> tags
    const textMatches = [...xml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gs)].map(
      (m) => m[1]
    );

    const cleanText = textMatches
      .join(" ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText || cleanText.length === 0) {
      throw new Error(
        "The uploaded Word document is empty (no text content found)."
      );
    }

    const paragraphMatches = [...xml.matchAll(/<w:p[\s>].*?<\/w:p>/gs)];
    const paragraphCount =
      paragraphMatches.length > 0 ? paragraphMatches.length : 1;
    const words = cleanText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    return {
      wordCount,
      paragraphCount,
      textPreview: cleanText.substring(0, 100),
    };
  } else if (ext === "doc") {
    // Validate OLE2 Compound File Binary Format magic bytes (D0 CF 11 E0 A1 B1 1A E1)
    const isOle =
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1;

    if (!isOle) {
      throw new Error(
        "Invalid Word document: File is not a valid .doc binary document."
      );
    }

    // Extract text strings from OLE document (look for ASCII / UTF-16LE text sequences)
    let extractedText = "";
    const asciiRegex = /[\x20-\x7E\t\r\n]{4,}/g;
    const strBuffer = buffer.toString("binary");
    const matches = strBuffer.match(asciiRegex) || [];
    const filtered = matches.filter(
      (s) =>
        !s.startsWith("Root Entry") &&
        !s.startsWith("WordDocument") &&
        !s.startsWith("Table") &&
        !s.startsWith("Data") &&
        !s.startsWith("SummaryInformation") &&
        !s.startsWith("DocumentSummaryInformation")
    );
    extractedText = filtered.join(" ").trim();

    if (!extractedText || extractedText.length === 0) {
      // Check UTF-16LE text sequences
      const utf16Matches = [];
      for (let i = 0; i < buffer.length - 8; i += 2) {
        if (buffer[i] >= 32 && buffer[i] <= 126 && buffer[i + 1] === 0) {
          let str = "";
          while (
            i < buffer.length - 1 &&
            buffer[i] >= 32 &&
            buffer[i] <= 126 &&
            buffer[i + 1] === 0
          ) {
            str += String.fromCharCode(buffer[i]);
            i += 2;
          }
          if (str.length >= 4) utf16Matches.push(str);
        }
      }
      extractedText = utf16Matches.join(" ").trim();
    }

    if (!extractedText || extractedText.length === 0) {
      throw new Error(
        "The uploaded Word document is empty (no readable text found)."
      );
    }

    const words = extractedText.split(/\s+/).filter(Boolean);
    const lineBreaks = (extractedText.match(/\r\n|\n|\r/g) || []).length;

    return {
      wordCount: words.length,
      paragraphCount: Math.max(1, lineBreaks + 1),
      textPreview: extractedText.substring(0, 100),
    };
  } else {
    throw new Error("Only Word documents (.docx / .doc) are allowed.");
  }
}

module.exports = { parseWordDocument };
