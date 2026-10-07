// Minimal .xlsx writer (no dependencies): styled cells, column widths, frozen panes, merged cells,
// and drop-down lists. Enough for the region planning workbook export; not a general spreadsheet library.
//
//   const blob = XlsxLite.build({ sheets: [{ name, cols: [30, 14], freeze: { x: 1, y: 2 }, merges: ['A1:C1'],
//     rows: [[ 'text', 12, { v: 0.042, s: 'pct' }, null ]], lists: [{ ref: 'B3:D3', items: ['Yes', 'No'] }] }] });
//
// A cell is a string, a number, null (empty), or { v, s } where s is a style name from STYLES below.
(function (global) {
  'use strict';

  const FONTS = [
    '<font><sz val="10"/><color rgb="FF28323E"/><name val="Segoe UI"/><family val="2"/></font>',
    '<font><b/><sz val="10"/><color rgb="FF0A2340"/><name val="Segoe UI"/><family val="2"/></font>',
    '<font><b/><sz val="15"/><color rgb="FF0A2340"/><name val="Segoe UI"/><family val="2"/></font>',
    '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/><family val="2"/></font>',
    '<font><i/><sz val="9"/><color rgb="FF5B6778"/><name val="Segoe UI"/><family val="2"/></font>',
  ];
  const FILLS = ['none', 'gray125', 'FF0F6CBD', 'FFDDEBF9', 'FFE2F3E8', 'FFFFF0C7', 'FFFBE1DD', 'FFF1F4F8'];
  const NUMFMTS = { 164: '+0.0%;-0.0%;0.0%', 165: '0.0', 166: '0%' };
  // name: [font, fill, border, numFmt, horizontal, no wrap]. Titles and notes don't wrap, so they run across the empty cells beside them.
  const STYLES = {
    plain: [0, 0, 0, 0, '', 1], title: [2, 0, 0, 0, '', 1], muted: [4, 0, 0, 0, '', 1], bold: [1, 0, 0, 0, '', 1],
    head: [3, 2, 1, 0], group: [1, 3, 1, 0], label: [1, 0, 1, 0], cell: [0, 0, 1, 0], soft: [0, 7, 1, 0],
    good: [0, 4, 1, 0], warn: [0, 5, 1, 0], bad: [0, 6, 1, 0],
    pct: [0, 0, 1, 164, 'right'], pctb: [1, 7, 1, 164, 'right'], num: [0, 0, 1, 165, 'right'],
    numgood: [0, 4, 1, 165, 'right'], numbad: [0, 6, 1, 165, 'right'], share: [0, 0, 1, 166, 'right'], int: [0, 0, 1, 1, 'right'],
  };
  const STYLE_INDEX = Object.fromEntries(Object.keys(STYLES).map((k, i) => [k, i]));

  const enc = new TextEncoder();
  const xml = s => String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = n => { let s = ''; for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
  const sheetName = (s, used) => {
    let n = String(s).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Sheet', i = 2;
    while (used.has(n.toLowerCase())) n = n.slice(0, 28) + ' ' + i++;
    used.add(n.toLowerCase());
    return n;
  };

  function stylesXml() {
    const fill = f => f === 'none' || f === 'gray125' ? `<fill><patternFill patternType="${f}"/></fill>`
      : `<fill><patternFill patternType="solid"><fgColor rgb="${f}"/><bgColor indexed="64"/></patternFill></fill>`;
    const side = t => `<${t} style="thin"><color rgb="FFCFD7E1"/></${t}>`;
    const xfs = Object.values(STYLES).map(([font, fl, border, fmt, h, nowrap]) =>
      `<xf numFmtId="${fmt}" fontId="${font}" fillId="${fl}" borderId="${border}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1">` +
      `<alignment vertical="top"${nowrap ? '' : ' wrapText="1"'}${h ? ` horizontal="${h}"` : ''}/></xf>`).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<numFmts count="${Object.keys(NUMFMTS).length}">${Object.entries(NUMFMTS).map(([id, c]) => `<numFmt numFmtId="${id}" formatCode="${xml(c)}"/>`).join('')}</numFmts>` +
      `<fonts count="${FONTS.length}">${FONTS.join('')}</fonts>` +
      `<fills count="${FILLS.length}">${FILLS.map(fill).join('')}</fills>` +
      `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border></borders>` +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${Object.keys(STYLES).length}">${xfs}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  }

  function sheetXml(sh, listRefs) {
    const rows = sh.rows.map((row, r) => {
      const cells = row.map((c, i) => {
        if (c === null || c === undefined || c === '') return '';
        const v = typeof c === 'object' ? c.v : c, s = STYLE_INDEX[(typeof c === 'object' && c.s) || 'plain'] ?? 0;
        const ref = colName(i) + (r + 1);
        if (v === null || v === undefined || v === '') return `<c r="${ref}" s="${s}"/>`;
        if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
        return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
      }).join('');
      return cells ? `<row r="${r + 1}">${cells}</row>` : '';
    }).join('');
    const f = sh.freeze || {}, fx = f.x || 0, fy = f.y || 0;
    const pane = fx || fy ? `<pane${fx ? ` xSplit="${fx}"` : ''}${fy ? ` ySplit="${fy}"` : ''} topLeftCell="${colName(fx)}${fy + 1}" activePane="${fx && fy ? 'bottomRight' : fy ? 'bottomLeft' : 'topRight'}" state="frozen"/>` : '';
    const cols = (sh.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const merges = (sh.merges || []).map(m => `<mergeCell ref="${m}"/>`).join('');
    const lists = (sh.lists || []).map(l =>
      `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="0" sqref="${l.ref}"><formula1>${listRefs(l.items)}</formula1></dataValidation>`).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
      `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>` +
      '<sheetFormatPr defaultRowHeight="15"/>' +
      (cols ? `<cols>${cols}</cols>` : '') +
      `<sheetData>${rows}</sheetData>` +
      (merges ? `<mergeCells count="${sh.merges.length}">${merges}</mergeCells>` : '') +
      (lists ? `<dataValidations count="${sh.lists.length}">${lists}</dataValidations>` : '') +
      '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
      '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
  }

  // ── zip (stored, no compression)
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      const head = (sig, extra) => {
        const v = new DataView(new ArrayBuffer(extra ? 46 : 30)); let p = 0;
        const u16 = x => { v.setUint16(p, x, true); p += 2; }, u32 = x => { v.setUint32(p, x, true); p += 4; };
        u32(sig); if (extra) u16(20); u16(20); u16(0x0800); u16(0); u16(time); u16(date); u32(crc); u32(data.length); u32(data.length); u16(name.length); u16(0);
        if (extra) { u16(0); u16(0); u16(0); u32(0); u32(offset); }
        return new Uint8Array(v.buffer);
      };
      central.push(head(0x02014b50, true), name);
      const local = head(0x04034b50, false);
      parts.push(local, name, data);
      offset += local.length + name.length + data.length;
    }
    const csize = central.reduce((n, p) => n + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, csize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function build(book) {
    const used = new Set(), sheets = book.sheets.map(s => ({ ...s, name: sheetName(s.name, used) }));
    // drop-down lists live on a hidden sheet, so items can hold commas and any length
    const lists = [], listKey = new Map();
    const listRefs = items => {
      const k = items.join('\u0001');
      if (!listKey.has(k)) { listKey.set(k, lists.length); lists.push(items); }
      return `Lists!$${colName(listKey.get(k))}$1:$${colName(listKey.get(k))}$${items.length}`;
    };
    const bodies = sheets.map(s => sheetXml(s, listRefs));
    if (lists.length) {
      const depth = Math.max(...lists.map(l => l.length));
      const rows = Array.from({ length: depth }, (_, r) => lists.map(l => l[r] ?? null));
      sheets.push({ name: sheetName('Lists', used), hidden: true });
      bodies.push(sheetXml({ rows, cols: lists.map(() => 34) }, listRefs));
    }
    const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const files = [
      { name: '[Content_Types].xml', text: head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>' },
      { name: '_rels/.rels', text: head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', text: head + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>' +
        sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}"${s.hidden ? ' state="hidden"' : ''} r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', text: head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', text: stylesXml() },
      ...bodies.map((text, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text })),
    ];
    return zip(files);
  }

  global.XlsxLite = { build, colName };
})(window);
