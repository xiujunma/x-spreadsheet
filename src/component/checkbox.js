import { Element, h } from './element';

export default class Checkbox {
    constructor(ri, ci, value) {
        this.ri = ri;
        this.ci = ci;
        this.checboxEl = h('input').attr('type', 'checkbox').attr('checked', value);
        const position = this.getPosition();
        this.el = h('div', '')
            .css('position', 'absolute')
            .css('left', `${position.x}px`).css('top', `${position.y}px`)
            .child(this.checboxEl)
            .show();
    }

    setValue(value) {
        this.checboxEl.attr('checked', value);
    }

    getValue() {
        return this.checboxEl.attr('checked');
    }

    getPosition() {
        const padding = {
            r: 28,
            c: 100
        }
        return {
            x: this.ci * 100 + padding.c,
            y: this.ri * 26 + padding.r
        }
    }
}