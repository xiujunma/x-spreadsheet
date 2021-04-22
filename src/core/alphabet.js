import './_.prototypes';

const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

/** index number 2 letters
 * @example stringAt(26) ==> 'AA'
 * @date 2019-10-10
 * @export
 * @param {number} index
 * @returns {string}
 */
export function stringAt(index) {
  let str = '';
  let cindex = index;
  while (cindex >= alphabets.length) {
    cindex /= alphabets.length;
    cindex -= 1;
    str += alphabets[parseInt(cindex, 10) % alphabets.length];
  }
  const last = index % alphabets.length;
  str += alphabets[last];
  return str;
}

/** translate letter in A1-tag to number
 * @date 2019-10-10
 * @export
 * @param {string} str "AA" in A1-tag "AA1"
 * @returns {number}
 */
export function indexAt(str) {
  let ret = 0;
  for (let i = 0; i < str.length - 1; i += 1) {
    const cindex = str.charCodeAt(i) - 65;
    const exponet = str.length - 1 - i;
    ret += (alphabets.length ** exponet) + (alphabets.length * cindex);
  }
  ret += str.charCodeAt(str.length - 1) - 65;
  return ret;
}

// B10 => x,y
/** translate A1-tag to XY-tag
 * @date 2019-10-10
 * @export
 * @param {tagA1} src
 * @returns {tagXY}
 */
export function expr2xy(src) {
  let x = '';
  let y = '';
  for (let i = 0; i < src.length; i += 1) {
    if (src.charAt(i) >= '0' && src.charAt(i) <= '9') {
      y += src.charAt(i);
    } else {
      x += src.charAt(i);
    }
  }
  return [indexAt(x), parseInt(y, 10) - 1];
}

/** translate XY-tag to A1-tag
 * @example x,y => B10
 * @date 2019-10-10
 * @export
 * @param {number} x
 * @param {number} y
 * @returns {tagA1}
 */
export function xy2expr(x, y) {
  return `${stringAt(x)}${y + 1}`;
}

function splitRef(src) {
  let x = '';
  let y = '';
  for (let i = 0; i < src.length; i += 1) {
    if (src.charAt(i) >= '0' && src.charAt(i) <= '9') {
      y += src.charAt(i);
    } else {
      const c = src.charAt(i);
      if (c === '$') {
        if (i === 0) x += c;
        else y += c;
      } else {
        x += c;
      }
    }
  }
  return [x, y];
}

/** translate A1-tag src by (xn, yn)
 * @date 2019-10-10
 * @export
 * @param {tagA1} src
 * @param {number} xn
 * @param {number} yn
 * @returns {tagA1}
 */
export function expr2expr(src, xn, yn, condition = () => true) {
  if (xn === 0 && yn === 0) return src;
  const [x, y] = expr2xy(src.replace(/\$/g, ''));
  if (!condition(x, y)) return src;

  let [xexp, yexp] = splitRef(src);
  if (!xexp.startsWith('$')) xexp = stringAt(indexAt(xexp) + xn);
  if (!yexp.startsWith('$')) yexp = `${parseInt(yexp, 10) + yn}`;
  return xexp + yexp;
}

export function expr2exprIgnoreAbsolute(src, xn, yn, condition = () => true) {
  if (xn === 0 && yn === 0) return src;
  const [x, y] = expr2xy(src.replace(/\$/g, ''));
  if (!condition(x, y)) return src;

  let [xexp, yexp] = splitRef(src);
  if (!xexp.startsWith('$')) {
    xexp = stringAt(indexAt(xexp) + xn);
  } else {
    xexp = '$' + stringAt(indexAt(xexp.replace(/\$/, '')) + xn);
  }
  if (!yexp.startsWith('$')) {
    yexp = `${parseInt(yexp, 10) + yn}`;
  } else {
    yexp = `$${parseInt(yexp.replace(/\$/, ''), 10) + yn}`;
  }
  return xexp + yexp;
}

export default {
  stringAt,
  indexAt,
  expr2xy,
  xy2expr,
  expr2expr,
  expr2exprIgnoreAbsolute
};
