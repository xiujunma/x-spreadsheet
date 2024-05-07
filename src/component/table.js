/* global isNaN */
import { stringAt } from '../core/alphabet';
import { getFontSizePxByPt } from '../core/font';
import _cell from '../core/cell';
import { formulam } from '../core/formula';
import { formatm } from '../core/format';
import { Element } from './element';
import Checkbox from '../component/checkbox';
import CellRange from '../core/cell_range';

import {
  Draw, DrawBox, thinLineWidth, npx,
} from '../canvas/draw';
// gobal var

const cellPaddingWidth = 5;
const tableFixedHeaderCleanStyle = { fillStyle: '#e8e9e8' };
const tableGridStyle = {
  fillStyle: '#fff',
  lineWidth: thinLineWidth,
  strokeStyle: '#d0d0d0',
};
function tableFixedHeaderStyle() {
  return {
    textAlign: 'center',
    textBaseline: 'middle',
    font: `500 ${npx(13)}px Helvetica`,
    fillStyle: '#585757',
    lineWidth: thinLineWidth(),
    strokeStyle: '#d0d0d0',
  };
}

function getDrawBox(data, rindex, cindex, yoffset = 0) {
  const {
    left, top, width, height,
  } = data.cellRect(rindex, cindex);
  return new DrawBox(left, top + yoffset, width, height, cellPaddingWidth);
}
/*
function renderCellBorders(bboxes, translateFunc) {
  const { draw } = this;
  if (bboxes) {
    const rset = new Set();
    // console.log('bboxes:', bboxes);
    bboxes.forEach(({ ri, ci, box }) => {
      if (!rset.has(ri)) {
        rset.add(ri);
        translateFunc(ri);
      }
      draw.strokeBorders(box);
    });
  }
}
*/

export function renderCell(draw, data, rindex, cindex, yoffset = 0) {
  const { sortedRowMap, rows, cols, settings } = data;
  if (rows.isHide(rindex) || cols.isHide(cindex)) return;
  let nrindex = rindex;
  if (sortedRowMap.has(rindex)) {
    nrindex = sortedRowMap.get(rindex);
  }

  const referenced = data.referenceCells && data.referenceCells.some(c => c[0] === cindex && c[1] === nrindex);
  let cell = data.getCell(nrindex, cindex);
  if (cell === null && !referenced) return;
  if (cell === null) cell = { text : ''}; 
  let frozen = false;
  if ('editable' in cell && cell.editable === false) {
    frozen = true;
  }

  const style = data.getCellStyleOrDefault(nrindex, cindex);
  const dbox = getDrawBox(data, rindex, cindex, yoffset);
  dbox.bgcolor = referenced ? '#F7D566' : style.bgcolor;
  if (style.border !== undefined) {
    dbox.setBorders(style.border);
    // bboxes.push({ ri: rindex, ci: cindex, box: dbox });
    draw.strokeBorders(dbox);
  }
  draw.rect(dbox, () => {
    // render text
    let cellText;
    if (!data.settings.evalEnabled) {
      cellText = cell.text || '';
    } else {
      cellText = _cell.render(cell.text || '', formulam, (y, x) => (data.getCellTextOrDefault(x, y)), [], settings.evalEnabled, window.variables);
    }
    
    const textColor = (style.negativeInRed && parseFloat(cellText) < 0) ? 'red' : style.color;
    cell.evaluatedValue = cellText;
    
    if (style.format) {
      if (!data.settings.evalEnabled && typeof cellText === 'string' && cellText.indexOf('=') === 0) {
        cellText = cellText
      } else {
        if (['number', 'percentage', 'currency', 'accounting'].some(format => style.format.indexOf(format) === 0)) {
          cellText = formatm[style.format].render(cellText, style);
        } else {
          cellText = formatm[style.format].render(cellText);
        }
      }
    }

    const font = Object.assign({}, style.font);
    font.size = getFontSizePxByPt(font.size);

    if (style.format === 'accounting' && style.symbol) {
      draw.text(style.symbol, dbox, {
        align: 'left',
        valign: style.valign,
        font,
        color: textColor,
        strike: style.strike,
        underline: style.underline,
      }, style.textwrap);
    }

    if (cell.type === 'img') {
      draw.image(cell.properties.src, dbox, cell.properties.width, cell.properties.height);
    } else {
      draw.text((style.zeroAsDash && (parseFloat(cellText) === 0 || !cellText)) ? '-' : cellText, dbox, {
        align: style.align || ((!isNaN(cellText) || cellText[0] === '=') ? 'right' : 'left'),
        valign: style.valign,
        font,
        color: textColor,
        strike: style.strike,
        underline: style.underline,
        note: cell.properties ? cell.properties.note : null,
      }, style.textwrap);

      const row = data.rows._[rindex];

      if (style.textwrap && dbox.extHeight > dbox.height && !row.height) {
        row.extHeight = dbox.extHeight;
      }

      if (row.expanded && !style.textwrap) {
        row.expanded = false;
        delete row.height;
      }
    }
    // error
    const error = data.validations.getError(rindex, cindex);
    if (error) {
      // console.log('error:', rindex, cindex, error);
      draw.error(dbox);
    }
    if (cell.unlocked && data.settings.unlockCells) {
      draw.indicator(dbox);
    }

    if (cell.hasConversation) {
      draw.indicator(dbox, 'rgba(255, 0, 0, 1)');
    }

    if (cell.properties && cell.properties.note) {
      draw.note(dbox);
    }
  });
}

function renderAutofilter(viewRange) {
  const { data, draw } = this;
  if (viewRange) {
    const { autoFilter } = data;
    if (!autoFilter.active()) return;
    const afRange = autoFilter.hrange();
    if (viewRange.intersects(afRange)) {
      afRange.each((ri, ci) => {
        const dbox = getDrawBox(data, ri, ci);
        draw.dropdown(dbox);
      });
    }
  }
}

function renderContent(viewRange, fw, fh, tx, ty) {
  const { draw, data } = this;
  draw.save();
  draw.translate(fw, fh)
    .translate(tx, ty);

  const { exceptRowSet } = data;
  // const exceptRows = Array.from(exceptRowSet);
  const filteredTranslateFunc = (ri) => {
    const ret = exceptRowSet.has(ri);
    if (ret) {
      const height = data.rows.getHeight(ri);
      draw.translate(0, -height);
    }
    return !ret;
  };

  const exceptRowTotalHeight = data.exceptRowTotalHeight(viewRange.sri, viewRange.eri);
  // 1 render cell
  draw.save();
  draw.translate(0, -exceptRowTotalHeight);
  viewRange.each((ri, ci) => {
    renderCell(draw, data, ri, ci);
  }, ri => filteredTranslateFunc(ri));
  draw.restore();


  // 2 render mergeCell
  const rset = new Set();
  draw.save();
  draw.translate(0, -exceptRowTotalHeight);
  data.eachMergesInView(viewRange, ({ sri, sci, eri }) => {
    if (!exceptRowSet.has(sri)) {
      renderCell(draw, data, sri, sci);
    } else if (!rset.has(sri)) {
      rset.add(sri);
      const height = data.rows.sumHeight(sri, eri + 1);
      draw.translate(0, -height);
    }
  });
  draw.restore();

  // 3 render autofilter
  renderAutofilter.call(this, viewRange);

  draw.restore();
}

function renderSelectedHeaderCell(x, y, w, h) {
  const { draw } = this;
  draw.save();
  draw.attr({ fillStyle: 'rgba(75, 137, 255, 0.08)' })
    .fillRect(x, y, w, h);
  draw.restore();
}

// viewRange
// type: all | left | top
// w: the fixed width of header
// h: the fixed height of header
// tx: moving distance on x-axis
// ty: moving distance on y-axis
function renderFixedHeaders(type, viewRange, w, h, tx, ty) {
  const { draw, data } = this;
  const sumHeight = viewRange.h; // rows.sumHeight(viewRange.sri, viewRange.eri + 1);
  const sumWidth = viewRange.w; // cols.sumWidth(viewRange.sci, viewRange.eci + 1);
  const nty = ty + h;
  const ntx = tx + w;

  draw.save();
  // draw rect background
  draw.attr(tableFixedHeaderCleanStyle);
  if (data.settings.highlightSpreadsheet) {
    draw.attr({ fillStyle: data.settings.highlightSpreadsheet });
  }
  if (type === 'all' || type === 'left') draw.fillRect(0, nty, w, sumHeight);
  if (type === 'all' || type === 'top') draw.fillRect(ntx, 0, sumWidth, h);

  const {
    sri, sci, eri, eci,
  } = data.selector.range;
  // console.log(data.selectIndexes);
  // draw text
  // text font, align...
  draw.attr(tableFixedHeaderStyle());
  // y-header-text
  if (type === 'all' || type === 'left') {
    data.rowEach(viewRange.sri, viewRange.eri, (i, y1, rowHeight) => {
      const y = nty + y1;
      const ii = i;
      draw.line([0, y], [w, y]);
      if (sri <= ii && ii < eri + 1) {
        renderSelectedHeaderCell.call(this, 0, y, w, rowHeight);
      }

      // highlight row headers
      if (data.rows._[i] && data.rows._[i].highlight) {
        draw.rect({
          x: 0,
          y: y,
          width: w,
          height: rowHeight,
          bgcolor: data.rows._[i].highlight
        }, () => {});
      }

      if (data.rows._[i] && data.rows._[i].hide) {
        draw.save();
        draw.attr({ fillStyle: '#ff0000', font: '20px Arial' });
        draw.fillText('X', w / 2, y + (rowHeight / 2));
        draw.restore();
      }

      draw.fillText(ii + 1, w / 2, y + (rowHeight / 2));
      if (i > 0 && data.rows.isHide(i - 1)) {
        draw.save();
        draw.attr({ strokeStyle: '#c6c6c6' });
        draw.line([5, y + 5], [w - 5, y + 5]);
        draw.restore();
      }
    });
    draw.line([0, sumHeight + nty], [w, sumHeight + nty]);
    draw.line([w, nty], [w, sumHeight + nty]);
  }
  // x-header-text
  if (type === 'all' || type === 'top') {
    data.colEach(viewRange.sci, viewRange.eci, (i, x1, colWidth) => {
      const x = ntx + x1;
      const ii = i;
      draw.line([x, 0], [x, h]);
      if (sci <= ii && ii < eci + 1) {
        renderSelectedHeaderCell.call(this, x, 0, colWidth, h);
      }

      // highlight column headers
      if (data.cols._[i] && data.cols._[i].highlight) {
        draw.rect({
          x: x,
          y: 0,
          width: colWidth,
          height: h,
          bgcolor: data.cols._[i].highlight
        }, () => {});
      }
      
      if (data.cols._[i] && data.cols._[i].hide) {
        draw.save();
        draw.attr({ fillStyle: '#ff0000', font: '20px Arial' });
        draw.fillText('X', x + (colWidth / 2), h / 2);
        draw.restore();
      }

      draw.fillText(stringAt(ii), x + (colWidth / 2), h / 2);
      if (i > 0 && data.cols.isHide(i - 1)) {
        draw.save();
        draw.attr({ strokeStyle: '#c6c6c6' });
        draw.line([x + 5, 5], [x + 5, h - 5]);
        draw.restore();
      }
    });
    draw.line([sumWidth + ntx, 0], [sumWidth + ntx, h]);
    draw.line([0, h], [sumWidth + ntx, h]);
  }
  draw.restore();
}

function renderFixedLeftTopCell(fw, fh) {
  const { draw, data } = this;
  draw.save();
  // left-top-cell
  draw.attr({ fillStyle: '#e8e9e8' });
  if (data.settings.highlightSpreadsheet) {
    draw.attr({ fillStyle: data.settings.highlightSpreadsheet });
  }
  draw.fillRect(0, 0, fw, fh);
  draw.restore();
}

function renderContentGrid({
  sri, sci, eri, eci, w, h,
}, fw, fh, tx, ty) {
  const { draw, data } = this;
  const { settings } = data;

  draw.save();
  draw.attr(tableGridStyle)
    .translate(fw + tx, fh + ty);
  // const sumWidth = cols.sumWidth(sci, eci + 1);
  // const sumHeight = rows.sumHeight(sri, eri + 1);
  // console.log('sumWidth:', sumWidth);
  if (!settings.showGrid) {
    draw.restore();
    return;
  }
  // console.log('rowStart:', rowStart, ', rowLen:', rowLen);
  data.rowEach(sri, eri, (i, y, ch) => {
    // console.log('y:', y);
    if (i !== sri) draw.line([0, y], [w, y]);
    if (i === eri) draw.line([0, y + ch], [w, y + ch]);
  });
  data.colEach(sci, eci, (i, x, cw) => {
    if (i !== sci) draw.line([x, 0], [x, h]);
    if (i === eci) draw.line([x + cw, 0], [x + cw, h]);
  });
  draw.restore();
}

function renderFreezeHighlightLine(fw, fh, ftw, fth) {
  const { draw, data } = this;
  const twidth = data.viewWidth() - fw;
  const theight = data.viewHeight() - fh;
  draw.save()
    .translate(fw, fh)
    .attr({ strokeStyle: 'rgba(75, 137, 255, .6)' });
  draw.line([0, fth], [twidth, fth]);
  draw.line([ftw, 0], [ftw, theight]);
  draw.restore();
}

/** end */
class Table {
  constructor(el, data) {
    this.el = el;
    this.draw = new Draw(el, data.viewWidth(), data.viewHeight());
    this.data = data;
    this.checkboxes = [];
  }

  resetData(data) {
    this.data = data;
    this.render();
  }

  render() {
    // resize canvas
    const { data } = this;
    const { rows, cols, settings } = data;
    // fixed width of header
    const fw = cols.indexWidth;
    // fixed height of header
    const fh = rows.height;

    this.draw.resize(data.viewWidth(), data.viewHeight());
    this.clear();

    const viewRange = data.viewRange();
    // renderAll.call(this, viewRange, data.scroll);
    const tx = data.freezeTotalWidth();
    const ty = data.freezeTotalHeight();
    const { x, y } = data.scroll;
    // 1
    if (!settings.plainMode) renderContentGrid.call(this, viewRange, fw, fh, tx, ty);
    renderContent.call(this, viewRange, fw, fh, -x, -y);
    if (!settings.plainMode) renderFixedHeaders.call(this, 'all', viewRange, fw, fh, tx, ty);
    if (!settings.plainMode) renderFixedLeftTopCell.call(this, fw, fh);
    const [fri, fci] = data.freeze;
    if (fri > 0 || fci > 0) {
      // 2
      if (fri > 0) {
        const vr = viewRange.clone();
        vr.sri = 0;
        vr.eri = fri - 1;
        vr.h = ty;
        if (!settings.plainMode) renderContentGrid.call(this, vr, fw, fh, tx, 0);
        renderContent.call(this, vr, fw, fh, -x, 0);
        if (!settings.plainMode) renderFixedHeaders.call(this, 'top', vr, fw, fh, tx, 0);
      }
      // 3
      if (fci > 0) {
        const vr = viewRange.clone();
        vr.sci = 0;
        vr.eci = fci - 1;
        vr.w = tx;
        if (!settings.plainMode) renderContentGrid.call(this, vr, fw, fh, 0, ty);
        if (!settings.plainMode) renderFixedHeaders.call(this, 'left', vr, fw, fh, 0, ty);
        renderContent.call(this, vr, fw, fh, 0, -y);
      }
      // 4
      const freezeViewRange = data.freezeViewRange();
      if (!settings.plainMode) renderContentGrid.call(this, freezeViewRange, fw, fh, 0, 0);
      if (!settings.plainMode) renderFixedHeaders.call(this, 'all', freezeViewRange, fw, fh, 0, 0);
      renderContent.call(this, freezeViewRange, fw, fh, 0, 0);
      // 5
      renderFreezeHighlightLine.call(this, fw, fh, tx, ty);
    }

    // checkbox
    const {sri, eri, sci, eci} = viewRange;
    const sheetEl = new Element(this.el.parentNode);
    Object.keys(rows._).forEach(row => {
      if (rows._[row].cells) Object.keys(rows._[row].cells).forEach(col => {
        const cell = rows._[row].cells[col];
        const rn = parseInt(row, 10);
        const cn = parseInt(col, 10);

        if (cell.type === 'checkbox') {
          const show = ((rn >= sri && rn <= eri) || rn < fri) && ((cn >= sci && cn <= eci) || cn < fci);
          const found = this.checkboxes.find(cb => cb.ri === row && cb.ci === col);
          const cellRect = data.cellRect(row, col);
          if (rn >= fri) cellRect.top -= data.scroll.y;
          if (cn >= fci) cellRect.left -= data.scroll.x;
          if (found) {
            found.setRect(cellRect);
            found.show(show);
          } else {
            const checkbox = new Checkbox(row, col, cellRect, cell);
            this.checkboxes.push(checkbox);
            sheetEl.child(checkbox.el);
            checkbox.el.show(show);
          }
        }
      });
    });
  }

  clear() {
    this.draw.clear();
  }

  highlight(ri, ci, timeout = 1000) {
    const { data, draw } = this;
    const { rows, cols } = data;
    const fw = cols.indexWidth;
    const fh = rows.height;
    const tx = data.freezeTotalWidth();
    const ty = data.freezeTotalHeight();

    draw.save();
    draw.translate(fw + tx, fh + ty);
    const drawBox = getDrawBox(data, ri, ci, 0);
    drawBox.setBorders({
      bottom: ['medium', '#fe0000'],
      left: ['medium', '#fe0000'],
      right: ['medium', '#fe0000'],
      top: ['medium', '#fe0000'],
    });
    draw.strokeBorders(drawBox);
    draw.restore();
    setTimeout(() => {
      this.render();
    }, timeout);
  }
}

export default Table;
