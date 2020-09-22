import { Element, h } from './element';

export default class Checkbox {
    constructor(ri, ci, rect, cell) {
        this.ri = ri;
        this.ci = ci;
        this.cell = cell;
        this.checkboxEl = h('input').attr('type', 'checkbox');
        if (cell.value) {
            this.checkboxEl.attr('checked', 'true');
        }
        
        const paddingLeft = 60 + parseInt((rect.width - 20) / 2);
        const paddingTop = 25 + parseInt((rect.height - 20) / 2);

        this.el = h('div', '')
            .css('position', 'absolute')
            .css('left', `${rect.left + paddingLeft}px`).css('top', `${rect.top + paddingTop}px`)
            .css('z-index', 10)
            .child(this.checkboxEl)
            .on('change', (event) => {
                this.cell.value = event.target.checked;
            })
            .show();
    }

    setValue(value) {
        if (value) {
            this.checkboxEl.attr('checked', value);
        } else {
            this.checkboxEl.removeAttr('checked');
        }
    }

    getValue() {
        return !!this.checkboxEl.attr('checked');
    }

    setRect(rect) {
        const paddingLeft = 60 + parseInt((rect.width - 20) / 2);
        const paddingTop = 25 + parseInt((rect.height - 20) / 2);
        this.el.css('left', `${rect.left + paddingLeft}px`).css('top', `${rect.top + paddingTop}px`);
    }

    show(show) {
        this.el.css('display', show ? 'block' : 'none');
    }
}