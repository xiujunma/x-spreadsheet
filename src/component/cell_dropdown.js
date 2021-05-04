import { Element, h } from './element';
import { cssPrefix } from '../config';
import { formatNumberRender } from '../core/format';


function formatItem(format, value) {
    switch(format) {
        case 'number':
            return formatNumberRender(value);
        case 'percent':
            return `${value * 100}%`
        default:
            return value;
    }
}
export default class CellDropdown {
    constructor() {
        this.el = h('div', `${cssPrefix}-suggest`)
            .css('position', 'absolute')
            .css('max-height', '240px')
            .css('left', '0').css('top', '0')
            .show();
    }

    setDropdown(x, y, format, list, callback) {
        this.el.html('');
        list.forEach(item => {
            const formattedValue = formatItem(format, item);
            const itemEl = h('div', `${cssPrefix}-item`)
            .attr('data-value', item)
            .html(formattedValue).on('click', (e) => {
                if (callback) callback(e.target.getAttribute('data-value'));
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