//* global window */
import { h } from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import { cssPrefix } from '../config';
// import { mouseMoveUp } from '../event';
import { xy2expr } from '../core/alphabet';

const arrowKeyCodes = [
  37, // arrow key left
  38, // arrow key up
  39, // arrow key right
  40 // arrow key down
];

const operators = [ '+', '-', '*', '/'];

function resetTextareaSize() {
  const { inputText } = this;
  if (!/^\s*$/.test(inputText)) {
    const {
      textlineEl, textEl, areaOffset,
    } = this;
    const txts = inputText.split('\n');
    const maxTxtSize = Math.max(...txts.map(it => it.length));
    const tlOffset = textlineEl.offset();
    const fontWidth = tlOffset.width / inputText.length;
    const tlineWidth = (maxTxtSize + 1) * fontWidth + 5;
    const maxWidth = this.viewFn().width - areaOffset.left - fontWidth;
    let h1 = txts.length;
    if (tlineWidth > areaOffset.width) {
      let twidth = tlineWidth;
      if (tlineWidth > maxWidth) {
        twidth = maxWidth;
        h1 += parseInt(tlineWidth / maxWidth, 10);
        h1 += (tlineWidth % maxWidth) > 0 ? 1 : 0;
      }
      textEl.css('width', `${twidth}px`);
    }
    h1 *= this.rowHeight;
    if (h1 > areaOffset.height) {
      textEl.css('height', `${h1}px`);
    }
  }
}

function insertText({ target }, itxt) {
  const { value, selectionEnd } = target;
  const ntxt = `${value.slice(0, selectionEnd)}${itxt}${value.slice(selectionEnd)}`;
  target.value = ntxt;
  target.setSelectionRange(selectionEnd + 1, selectionEnd + 1);

  this.inputText = ntxt;
  this.textlineEl.html(ntxt);
  resetTextareaSize.call(this);
}

function keydownEventHandler(evt) {
  const { keyCode, altKey } = evt;
  if (keyCode !== 13 && keyCode !== 9) evt.stopPropagation();
  if (keyCode === 13 && altKey) {
    insertText.call(this, evt, '\n');
    evt.stopPropagation();
  }
  if (keyCode === 13 && !altKey) evt.preventDefault();
  if (keyCode === 27) {
    this.clear(true);
  }
}

function inputEventHandler(evt) {
  const v = evt.target.value;
  // console.log(evt, 'v:', v);
  const { suggest, textlineEl, validator } = this;
  const { cell } = this;
  if (cell !== null) {
    if (('editable' in cell && cell.editable === true) || (cell.editable === undefined)) {
      this.inputText = v;
      if (validator) {
        if (validator.type === 'list') {
          suggest.search(v);
        } else {
          suggest.hide();
        }
      } else {
        const start = v.lastIndexOf('=');
        if (start !== -1) {
          suggest.search(v.substring(start + 1));
        } else {
          suggest.hide();
        }
      }
      textlineEl.html(v);
      resetTextareaSize.call(this);
      this.change('input', v, this.selected);
    } else {
      evt.target.value = '';
    }
  } else {
    this.inputText = v;
    if (validator) {
      if (validator.type === 'list') {
        suggest.search(v);
      } else {
        suggest.hide();
      }
    } else {
      const start = v.lastIndexOf('=');
      if (start !== -1) {
        suggest.search(v.substring(start + 1));
      } else {
        suggest.hide();
      }
    }
    textlineEl.html(v);
    resetTextareaSize.call(this);
    this.change('input', v, this.selected);
  }
}

function setTextareaRange(position) {
  const { el } = this.textEl;
  setTimeout(() => {
    el.focus();
    el.setSelectionRange(position, position);
  }, 0);
}

function setText(text, position) {
  const { textEl, textlineEl } = this;
  // firefox bug
  textEl.el.blur();

  textEl.val(text);
  textlineEl.html(text);
  setTextareaRange.call(this, position);
}

function suggestItemClick(it) {
  const { inputText, validator } = this;
  let position = 0;
  if (validator && validator.type === 'list') {
    this.inputText = it;
    position = this.inputText.length;
  } else {
    const start = inputText.lastIndexOf('=');
    const sit = inputText.substring(0, start + 1);
    let eit = inputText.substring(start + 1);
    if (eit.indexOf(')') !== -1) {
      eit = eit.substring(eit.indexOf(')'));
    } else {
      eit = '';
    }
    this.inputText = `${sit + it.key}(`;
    // console.log('inputText:', this.inputText);
    position = this.inputText.length;
    this.inputText += `)${eit}`;
  }
  setText.call(this, this.inputText, position);
}

function resetSuggestItems() {
  this.suggest.setItems(this.formulas);
}

function dateFormat(d) {
  let month = d.getMonth() + 1;
  let date = d.getDate();
  if (month < 10) month = `0${month}`;
  if (date < 10) date = `0${date}`;
  return `${d.getFullYear()}-${month}-${date}`;
}

export default class Editor {
  constructor(formulas, viewFn, rowHeight) {
    this.viewFn = viewFn;
    this.rowHeight = rowHeight;
    this.formulas = formulas;
    this.suggest = new Suggest(formulas, (it) => {
      suggestItemClick.call(this, it);
    });
    this.datepicker = new Datepicker();
    this.datepicker.change((d) => {
      // console.log('d:', d);
      this.setText(dateFormat(d));
      this.clear();
    });
    this.areaEl = h('div', `${cssPrefix}-editor-area`)
      .children(
        this.textEl = h('textarea', '')
          .on('input', evt => inputEventHandler.call(this, evt))
          .on('paste.stop', () => {})
          .on('keydown', evt => keydownEventHandler.call(this, evt)),
        this.textlineEl = h('div', 'textline'),
        this.suggest.el,
        this.datepicker.el,
      )
      .on('mousemove.stop', () => {})
      .on('mousedown.stop', () => {});
    this.el = h('div', `${cssPrefix}-editor`)
      .child(this.areaEl).hide();
    this.suggest.bindInputEvents(this.textEl);

    this.areaOffset = null;
    this.freeze = { w: 0, h: 0 };
    this.cell = null;
    this.inputText = '';
    this.change = () => {};
    this.active =false;

    this.textEl.el.onkeydown = event => {
      if (arrowKeyCodes.indexOf(event.keyCode) > -1) {
        this.suggest.hide();
        if (this.isOpenOperator()) {
          event.preventDefault();

          // create new event
          const newEvent = document.createEvent('Event');
          newEvent.initEvent(
            'keydown',
            true, // bubbles?
            true // cancelable?
            );
  
          const {
            keyCode,
            key,
            ctrlKey,
            shiftKey,
            metaKey
          } = event;
  
          newEvent.keyCode = keyCode;
          newEvent.key = key;
          newEvent.ctrlKey = ctrlKey;
          newEvent.shiftKey = shiftKey;
          newEvent.metaKey = metaKey;
          window.dispatchEvent(newEvent);
        }
     }

     if (operators.indexOf(event.key) > -1) {
       const { el } = this.textEl;
       const end = el.selectionEnd;
       el.setSelectionRange(end, end);
     }
    };
  }

  isOpenOperator() {
    const text = this.inputText;
    if (!text) return false;
    const {selectionStart, selectionEnd} = this.textEl.el;
    const remain = text.replace(text.substring(selectionStart, selectionEnd), '');
    if (!remain) return false;
    return ['=', '*', '-', '/', '+'].some(op => remain.indexOf(op) === remain.length - 1);
  }

  setFreezeLengths(width, height) {
    this.freeze.w = width;
    this.freeze.h = height;
  }

  clear(discard = false) {
    // const { cell } = this;
    // const cellText = (cell && cell.text) || '';
    if (!discard) {
      if (this.inputText !== '') {
        this.change('finished', this.inputText, this.selected);
      }
    } else {
      this.change('finished', this.originValue, this.selected);
    }

    this.cell = null;
    this.areaOffset = null;
    this.inputText = '';
    this.el.hide();
    this.textEl.val('');
    this.textlineEl.html('');
    resetSuggestItems.call(this);
    this.datepicker.hide();
    this.active = false;
  }

  setOffset(offset, suggestPosition = 'top') {
    const {
      textEl, areaEl, suggest, freeze, el,
    } = this;
    if (offset) {
      this.areaOffset = offset;
      const {
        left, top, width, height, l, t,
      } = offset;
      // console.log('left:', left, ',top:', top, ', freeze:', freeze);
      const elOffset = { left: 0, top: 0 };
      // top left
      if (freeze.w > l && freeze.h > t) {
        //
      } else if (freeze.w < l && freeze.h < t) {
        elOffset.left = freeze.w;
        elOffset.top = freeze.h;
      } else if (freeze.w > l) {
        elOffset.top = freeze.h;
      } else if (freeze.h > t) {
        elOffset.left = freeze.w;
      }
      el.offset(elOffset);
      areaEl.offset({ left: left - elOffset.left - 0.8, top: top - elOffset.top - 0.8 });
      textEl.offset({ width: width - 9 + 0.8, height: height - 3 + 0.8 });
      const sOffset = { left: 0 };
      sOffset[suggestPosition] = height;
      suggest.setOffset(sOffset);
      suggest.hide();
    }
  }

  setCell(cell, validator, selected) {
    // console.log('::', validator);
    const { el, datepicker, suggest } = this;

    this.originValue = cell && cell.text ? cell.text : '';

    el.show();
    this.cell = cell;
    const text = (cell && cell.text) || '';
    this.setText(text);

    this.validator = validator;
    if (validator) {
      const { type } = validator;
      if (type === 'date') {
        datepicker.show();
        if (!/^\s*$/.test(text)) {
          datepicker.setValue(text);
        }
      }
      if (type === 'list') {
        suggest.setItems(validator.values());
        suggest.search('');
      }
    }
    this.active = true;
    this.selected = selected;
  }

  setText(text) {
    this.inputText = text;
    // console.log('text>>:', text);
    setText.call(this, text, text.length);
    resetTextareaSize.call(this);
  }

  setRange(range) {
    let location;
    if (range.sri === range.eri && range.sci === range.eci) {
      location = xy2expr(range.sci, range.sri);
    } else {
      const begin = xy2expr(range.sci, range.sri);
      const end = xy2expr(range.eci, range.eri);
      location = `${begin}:${end}`;
    }
    const insertIndex = this.textEl.el.selectionStart;
    const end = this.textEl.el.selectionEnd;
    const text = this.inputText.slice(0, insertIndex) + this.inputText.slice(end);
    const formula = [text.slice(0, insertIndex), location, text.slice(insertIndex)].join('');
    this.inputText = formula;

    this.textEl.val(formula);
    this.textlineEl.html(formula);

    this.textEl.el.setSelectionRange(insertIndex, insertIndex + location.length);
    setTimeout(() => {
      this.textEl.el.focus();
    }, 0);
  }
}
