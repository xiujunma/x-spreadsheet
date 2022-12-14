import { tf } from '../locale/locale';



const formatStringRender = v => v;

const formatNumberRender = (text, options) => {
  const {
    decimal,
    thousandSeparator,
    negativeInParentheses,
    negativeInRed,
    zeroAsDash,
  } = options;

  const number = parseFloat(text);

  if (isNaN(number)) return text;

  if (zeroAsDash && number === 0) return '-';

  let formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimal,
    minimumFractionDigits: decimal,
    useGrouping: thousandSeparator,
  }).format(Math.abs(number));

  if (number < 0) {
    if (negativeInParentheses) {
      formatted = `(${formatted})`;
    } else if (!negativeInRed) {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
};

const formatCurrencyRender = (text, options) => {
  const {
    decimal,
    negativeInParentheses,
    negativeInRed,
    symbol,
    zeroAsDash,
  } = options;

  const number = parseFloat(text);

  if (isNaN(number)) return text;

  if (zeroAsDash && number === 0) return `${symbol} -`;

  let formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (symbol => {
      switch (symbol) {
        case '$':
          return 'USD';
        case '€':
          return 'EUR';
        default:
          return 'USD';
      }
    })(symbol),
    maximumFractionDigits: decimal,
    minimumFractionDigits: decimal,
    useGrouping: true,
  }).format(Math.abs(number));

  if (number < 0) {
    if (negativeInParentheses) {
      formatted = `(${formatted})`;
    } else if (!negativeInRed) {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
};

const formatAccountingRender = (text, options) => {
  const {
    decimal,
    negativeInParentheses,
    negativeInRed,
  } = options;

  const number = parseFloat(text);

  if (isNaN(number)) return text;

  if (number === 0) return '-';

  let formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimal,
    minimumFractionDigits: decimal,
    useGrouping: true,
  }).format(Math.abs(number));

  if (number < 0) {
    if (negativeInParentheses) {
      formatted = `(${formatted})`;
    } else if (!negativeInRed) {
      formatted = `-${formatted}`;
    }
  }

  return formatted;
};

const formatPercentageRender = (text, options) => {
  const {
    decimal,
    zeroAsDash,
  } = options;

  const number = parseFloat(text);

  if (isNaN(number)) return text;

  if (number === 0 && zeroAsDash) return '-%';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimal,
    minimumFractionDigits: decimal,
    useGrouping: false,
  }).format(number * 100);

  return `${formatted}%`;
};


const baseFormats = [
  {
    key: 'general',
    title: tf('format.general'),
    type: 'string',
    render: formatStringRender,
  },
  {
    key: 'normal',
    title: tf('format.text'),
    type: 'string',
    render: formatStringRender,
  },
  {
    key: 'number',
    title: tf('format.number'),
    type: 'number',
    label: '1,000.12',
    render: formatNumberRender,
  },
  {
    key: 'currency',
    title: tf('format.currency'),
    type: 'number',
    label: '$1,000.12',
    render: formatCurrencyRender,
  },
  {
    key: 'accounting',
    title: tf('format.accounting'),
    type: 'number',
    label: '$1,000.12',
    render: formatAccountingRender,
  },
  {
    key: 'percentage',
    title: tf('format.percentage'),
    type: 'number',
    label: '10.12%',
    render: formatPercentageRender,
  },
  {
    key: 'date',
    title: tf('format.date'),
    type: 'date',
    label: '26/09/2008',
    render: formatStringRender,
  },
  {
    key: 'time',
    title: tf('format.time'),
    type: 'date',
    label: '15:59:00',
    render: formatStringRender,
  },
  {
    key: 'datetime',
    title: tf('format.datetime'),
    type: 'date',
    label: '26/09/2008 15:59:00',
    render: formatStringRender,
  },
  {
    key: 'duration',
    title: tf('format.duration'),
    type: 'date',
    label: '24:01:00',
    render: formatStringRender,
  },
  {
    key: 'more',
    title: (() => {return 'More Formats'})
  }
];

// const formats = (ary = []) => {
//   const map = {};
//   baseFormats.concat(ary).forEach((f) => {
//     map[f.key] = f;
//   });
//   return map;
// };
const formatm = {};
baseFormats.forEach((f) => {
  formatm[f.key] = f;
});

export default {
};
export {
  formatm,
  baseFormats,
  formatNumberRender
};
