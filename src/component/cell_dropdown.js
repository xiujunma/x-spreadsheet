import { Element, h } from './element';
import { cssPrefix } from '../config';

export default class CellDropdown {
    constructor() {
        this.el = h('div', `${cssPrefix}-suggest`)
            .css('position', 'absolute')
            .css('left', '0').css('top', '0')
            .show();
    }

    setDropdown(x, y, list, callback) {
        this.el.html('');
        list.forEach(item => {
            const itemEl = h('div', `${cssPrefix}-item`).html(item).on('click', (e) => {
                if (callback) callback(e.target.innerHTML);
                this.el.hide();
            });
            this.el.child(itemEl)
        });

        this.el.css('left', `${x + 60}px`).css('top', `${y + 51}px`);
        this.el.show();
    }
    hide() {
        this.el.hide();
    }
}