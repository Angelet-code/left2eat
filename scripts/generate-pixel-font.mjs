import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "src", "fonts");
const outPath = path.join(outDir, "left2eat-pixel.ttf");

const PIXEL = 100;
const UNITS_PER_EM = 1000;
const ASCENT = 900;
const DESCENT = -150;

const PATTERNS = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
  ".": ["00", "00", "00", "00", "00", "11", "11"],
  ",": ["00", "00", "00", "00", "00", "11", "01"],
  ":": ["00", "11", "11", "00", "00", "11", "11"],
  ";": ["00", "11", "11", "00", "00", "11", "01"],
  "!": ["1", "1", "1", "1", "1", "0", "1"],
  "?": ["1110", "0001", "0001", "0010", "0100", "0000", "0100"],
  "¡": ["1", "0", "1", "1", "1", "1", "1"],
  "¿": ["0100", "0000", "0010", "0100", "1000", "1000", "0111"],
  "-": ["000", "000", "000", "111", "000", "000", "000"],
  "+": ["000", "010", "010", "111", "010", "010", "000"],
  "*": ["000", "101", "010", "111", "010", "101", "000"],
  "/": ["0001", "0001", "0010", "0010", "0100", "1000", "1000"],
  "=": ["0000", "1111", "0000", "1111", "0000", "0000", "0000"],
  "(": ["01", "10", "10", "10", "10", "10", "01"],
  ")": ["10", "01", "01", "01", "01", "01", "10"],
  "%": ["10001", "00010", "00100", "01000", "10000", "00000", "10001"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "'": ["1", "1", "0", "0", "0", "0", "0"],
  "\"": ["101", "101", "000", "000", "000", "000", "000"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  "@": ["01110", "10001", "10111", "10101", "10111", "10000", "01111"],
  "·": ["0", "0", "0", "1", "0", "0", "0"],
  "_": ["0000", "0000", "0000", "0000", "0000", "0000", "1111"]
};

const ACCENTS = new Map([
  ["Á", ["A", "acute"]], ["É", ["E", "acute"]], ["Í", ["I", "acute"]],
  ["Ó", ["O", "acute"]], ["Ú", ["U", "acute"]], ["Ý", ["Y", "acute"]],
  ["À", ["A", "grave"]], ["È", ["E", "grave"]], ["Ì", ["I", "grave"]],
  ["Ò", ["O", "grave"]], ["Ù", ["U", "grave"]],
  ["Ä", ["A", "diaeresis"]], ["Ë", ["E", "diaeresis"]], ["Ï", ["I", "diaeresis"]],
  ["Ö", ["O", "diaeresis"]], ["Ü", ["U", "diaeresis"]],
  ["Ñ", ["N", "tilde"]], ["Ç", ["C", "cedilla"]]
]);

const CHARS = Array.from(new Set([
  ..." ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ..."ÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÄËÏÖäëïöÇç",
  ...".,;:!?¡¿+-*/=()%&·'\"#@_"
]));

function be16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value & 0xffff, 0);
  return buffer;
}

function bei16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeInt16BE(value, 0);
  return buffer;
}

function be32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function bei32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
}

function tag(value) {
  return Buffer.from(value, "ascii");
}

function concat(parts) {
  return Buffer.concat(parts);
}

function pad(buffer, multiple = 4) {
  const extra = (multiple - (buffer.length % multiple)) % multiple;
  return extra ? Buffer.concat([buffer, Buffer.alloc(extra)]) : buffer;
}

function checksum(buffer) {
  const padded = pad(buffer);
  let sum = 0;
  for (let index = 0; index < padded.length; index += 4) {
    sum = (sum + padded.readUInt32BE(index)) >>> 0;
  }
  return sum >>> 0;
}

function normalizeChar(char) {
  const upper = char.toUpperCase();
  if (ACCENTS.has(upper)) return ACCENTS.get(upper);
  if (PATTERNS[upper]) return [upper, null];
  if (PATTERNS[char]) return [char, null];
  return ["?", null];
}

function accentRects(kind, width) {
  const center = Math.max(0, Math.floor(width / 2));
  if (kind === "acute") return [{ x: center * PIXEL, y: 800 }];
  if (kind === "grave") return [{ x: Math.max(0, center - 1) * PIXEL, y: 800 }];
  if (kind === "diaeresis") return [{ x: Math.max(0, center - 1) * PIXEL, y: 800 }, { x: Math.min(width - 1, center + 1) * PIXEL, y: 800 }];
  if (kind === "tilde") return [
    { x: Math.max(0, center - 2) * PIXEL, y: 780 },
    { x: Math.max(0, center - 1) * PIXEL, y: 830 },
    { x: center * PIXEL, y: 830 },
    { x: Math.min(width - 1, center + 1) * PIXEL, y: 780 }
  ];
  if (kind === "cedilla") return [{ x: center * PIXEL, y: -90 }, { x: Math.max(0, center - 1) * PIXEL, y: -140 }];
  return [];
}

function glyphRects(char) {
  const [base, accent] = normalizeChar(char);
  const pattern = PATTERNS[base] || PATTERNS["?"];
  const width = pattern[0].length;
  const rects = [];

  pattern.forEach((row, rowIndex) => {
    Array.from(row).forEach((cell, colIndex) => {
      if (cell !== "1") return;
      rects.push({
        x: colIndex * PIXEL,
        y: (pattern.length - rowIndex - 1) * PIXEL
      });
    });
  });

  rects.push(...accentRects(accent, width));
  return { rects, width };
}

function rectToPoints(rect) {
  const x = rect.x;
  const y = rect.y;
  return [
    [x, y],
    [x, y + PIXEL],
    [x + PIXEL, y + PIXEL],
    [x + PIXEL, y]
  ];
}

function buildGlyph(char) {
  const { rects, width } = glyphRects(char);
  const advanceWidth = Math.max(250, (width + 1) * PIXEL);
  if (!rects.length) return { buffer: Buffer.alloc(0), advanceWidth, lsb: 0, points: 0, contours: 0, xMax: 0 };

  const contours = rects.map(rectToPoints);
  const points = contours.flat();
  const endPts = [];
  let pointCount = 0;
  contours.forEach((contour) => {
    pointCount += contour.length;
    endPts.push(pointCount - 1);
  });

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xMin = Math.min(...xs);
  const yMin = Math.min(...ys);
  const xMax = Math.max(...xs);
  const yMax = Math.max(...ys);

  const flags = Buffer.alloc(points.length, 0x01);
  const xDeltas = [];
  const yDeltas = [];
  let lastX = 0;
  let lastY = 0;
  points.forEach(([x, y]) => {
    xDeltas.push(bei16(x - lastX));
    yDeltas.push(bei16(y - lastY));
    lastX = x;
    lastY = y;
  });

  return {
    buffer: concat([
      bei16(contours.length),
      bei16(xMin), bei16(yMin), bei16(xMax), bei16(yMax),
      ...endPts.map(be16),
      be16(0),
      flags,
      ...xDeltas,
      ...yDeltas
    ]),
    advanceWidth,
    lsb: 0,
    points: points.length,
    contours: contours.length,
    xMax
  };
}

function buildCmap(codeToGlyph) {
  const codes = Array.from(codeToGlyph.keys()).sort((a, b) => a - b);
  const segCount = codes.length + 1;
  const entrySelector = Math.floor(Math.log2(segCount));
  const searchRange = 2 * (2 ** entrySelector);
  const rangeShift = 2 * segCount - searchRange;
  const endCodes = [...codes, 0xffff];
  const startCodes = [...codes, 0xffff];
  const deltas = codes.map((code) => (codeToGlyph.get(code) - code) & 0xffff);
  deltas.push(1);
  const rangeOffsets = new Array(segCount).fill(0);
  const format4Length = 16 + segCount * 8;

  const format4 = concat([
    be16(4), be16(format4Length), be16(0), be16(segCount * 2), be16(searchRange), be16(entrySelector), be16(rangeShift),
    ...endCodes.map(be16),
    be16(0),
    ...startCodes.map(be16),
    ...deltas.map(be16),
    ...rangeOffsets.map(be16)
  ]);

  return concat([
    be16(0), be16(1),
    be16(3), be16(1), be32(12),
    format4
  ]);
}

function utf16be(value) {
  const bytes = [];
  for (const unit of value) {
    const code = unit.charCodeAt(0);
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  return Buffer.from(bytes);
}

function buildName() {
  const names = [
    [1, "Left2Eat Pixel"],
    [2, "Regular"],
    [3, "Left2Eat Pixel Regular 1.0"],
    [4, "Left2Eat Pixel"],
    [5, "Version 1.0"],
    [6, "Left2EatPixel-Regular"]
  ].map(([nameId, value]) => [nameId, utf16be(value)]);
  const stringOffset = 6 + names.length * 12;
  let offset = 0;
  const records = [];
  const strings = [];

  names.forEach(([nameId, value]) => {
    records.push(concat([
      be16(3), be16(1), be16(0x0409), be16(nameId), be16(value.length), be16(offset)
    ]));
    strings.push(value);
    offset += value.length;
  });

  return concat([be16(0), be16(names.length), be16(stringOffset), ...records, ...strings]);
}

function buildHead(xMax) {
  const created = Buffer.alloc(8);
  const modified = Buffer.alloc(8);
  return concat([
    be32(0x00010000), be32(0x00010000), be32(0), be32(0x5f0f3cf5),
    be16(0x000b), be16(UNITS_PER_EM),
    created, modified,
    bei16(0), bei16(DESCENT), bei16(xMax), bei16(ASCENT),
    be16(0), be16(8), bei16(2), bei16(1), bei16(0)
  ]);
}

function buildHhea(glyphs) {
  const advanceMax = Math.max(...glyphs.map((glyph) => glyph.advanceWidth));
  const xMaxExtent = Math.max(...glyphs.map((glyph) => glyph.xMax));
  return concat([
    be32(0x00010000), bei16(ASCENT), bei16(DESCENT), bei16(0),
    be16(advanceMax), bei16(0), bei16(0), bei16(xMaxExtent),
    bei16(1), bei16(0), bei16(0),
    bei16(0), bei16(0), bei16(0), bei16(0),
    bei16(0), be16(glyphs.length)
  ]);
}

function buildMaxp(glyphs) {
  return concat([
    be32(0x00010000), be16(glyphs.length),
    be16(Math.max(...glyphs.map((glyph) => glyph.points), 4)),
    be16(Math.max(...glyphs.map((glyph) => glyph.contours), 1)),
    be16(0), be16(0), be16(2), be16(0), be16(0), be16(0), be16(0), be16(0), be16(0), be16(0)
  ]);
}

function buildOS2(codes) {
  return concat([
    be16(0), bei16(560), be16(400), be16(5), be16(0),
    bei16(650), bei16(600), bei16(0), bei16(75),
    bei16(650), bei16(600), bei16(0), bei16(350),
    bei16(50), bei16(250), bei16(0),
    Buffer.from([2, 11, 6, 9, 3, 5, 4, 2, 2, 4]),
    be32(0x00000087), be32(0), be32(0), be32(0),
    tag("L2ET"),
    be16(0x0040),
    be16(Math.min(...codes)), be16(Math.max(...codes)),
    bei16(ASCENT), bei16(DESCENT), bei16(0),
    be16(ASCENT), be16(Math.abs(DESCENT))
  ]);
}

function buildPost() {
  return concat([
    be32(0x00030000), be32(0), bei16(-75), bei16(50),
    be32(1), be32(0), be32(0), be32(0), be32(0)
  ]);
}

function assembleFont(tables) {
  const tags = Object.keys(tables).sort();
  const numTables = tags.length;
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 16 * (2 ** entrySelector);
  const rangeShift = numTables * 16 - searchRange;
  let offset = 12 + numTables * 16;
  const records = [];
  const bodies = [];

  tags.forEach((tableTag) => {
    const body = tables[tableTag];
    records.push(concat([tag(tableTag), be32(checksum(body)), be32(offset), be32(body.length)]));
    bodies.push(pad(body));
    offset += pad(body).length;
  });

  return concat([
    be32(0x00010000),
    be16(numTables), be16(searchRange), be16(entrySelector), be16(rangeShift),
    ...records,
    ...bodies
  ]);
}

const glyphChars = ["\0", ...CHARS];
const glyphs = glyphChars.map((char, index) => index === 0 ? buildGlyph("?") : buildGlyph(char));
const codeToGlyph = new Map();
glyphChars.slice(1).forEach((char, index) => {
  codeToGlyph.set(char.charCodeAt(0), index + 1);
});

const glyphBuffers = [];
const offsets = [];
let glyfOffset = 0;
glyphs.forEach((glyph) => {
  offsets.push(glyfOffset);
  const paddedGlyph = pad(glyph.buffer, 2);
  glyphBuffers.push(paddedGlyph);
  glyfOffset += paddedGlyph.length;
});
offsets.push(glyfOffset);

const glyf = concat(glyphBuffers);
const loca = concat(offsets.map(be32));
const hmtx = concat(glyphs.flatMap((glyph) => [be16(glyph.advanceWidth), bei16(glyph.lsb)]));
const codes = Array.from(codeToGlyph.keys());
const xMax = Math.max(...glyphs.map((glyph) => glyph.xMax));

const tables = {
  "OS/2": buildOS2(codes),
  cmap: buildCmap(codeToGlyph),
  glyf,
  head: buildHead(xMax),
  hhea: buildHhea(glyphs),
  hmtx,
  loca,
  maxp: buildMaxp(glyphs),
  name: buildName(),
  post: buildPost()
};

const firstPass = assembleFont(tables);
const adjustment = (0xb1b0afba - checksum(firstPass)) >>> 0;
tables.head.writeUInt32BE(adjustment, 8);

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, assembleFont(tables));
console.log(`generated ${path.relative(root, outPath)}`);
