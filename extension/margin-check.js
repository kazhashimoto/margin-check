(function(classname, init_options, process) {
  const CLASSNAME = classname;
  let options = {};

  const from_extension = (typeof chrome !== 'undefined' && chrome.extension);
  if (document.body.classList.contains(CLASSNAME)) {
    if (!from_extension) {
      const script_src = document.currentScript.src;
      const el = document.querySelectorAll(`script[src="${script_src}"]`);
      if (el.length) {
        const last = el[el.length - 1];
        last.remove();
      }
    }
    document.body.classList.toggle(`${CLASSNAME}-active`);
    return;
  }

  options.preset = true;
  init_options(options);
  if (from_extension) {
    chrome.storage.sync.get('options', function(result) {
      if ('options' in result) {
        options = Object.assign({}, result.options);
        options.preset = false;
      }
      start();
    });
  } else {
    start();
  }

  function start() {
    document.body.classList.add(CLASSNAME, `${CLASSNAME}-active`);
    process(options);
  }

})('margin-check',
function(options) {
  options.items = {};
  options.items.unit = true;
  options.items.maxDigits = 5;
  options.colors = {};
  options.colors.borderColor = 'red';
},
function(options) {
  const labelMap = new Map();
  const unit = options.items.unit? 'px': '';
  const max_digits = Number(options.items.maxDigits);

  function scan_elements() {
    Array.from(document.querySelectorAll('body *'))
      .filter(e => {
        const ignore = ['script', 'link', 'noscript'];
        if (ignore.includes(e.localName)) {
          return false;
        }
        if (e.classList.contains('_margin')) {
          return false;
        }
        return !e.classList.contains('_has-markers');
    }).forEach(e => {
      const m = get_margin_values(e);
      if (m[0] !== m[1]) {
        e.style.outline = `1px solid ${options.colors.borderColor}`;
        show_margin(e, m);
      }
    });
  }

  function get_margin_values(e) {
    const style = window.getComputedStyle(e);
    const m = [style.marginLeft, style.marginRight].map(e => parseFloat(e));
    return m;
  }

  function show_margin(e, margins) {
    add_marker(e, '_margin-left', margins[0]);
    add_marker(e, '_margin-right', margins[1]);
    e.classList.add('_has-markers');
  }

  function set_marker_color(o, color) {
    o.style.borderColor = color;
    o.style.backgroundImage = `linear-gradient(to right, ${color}, ${color})`;
  }

  function set_indicator(o, color, dir) {
    o.style.border = 'none';
    if (dir == 'left') {
      o.style.borderLeft = `1px solid ${color}`;
    } else {
      o.style.borderRight = `1px solid ${color}`;
    }
  }

  function add_marker(target, cls, length) {
    const base = target.getBoundingClientRect();
    const o = document.createElement('div');
    o.classList.add('_margin', cls);

    const color = (length < 0)? 'blue': 'red';
    o.style.position = 'fixed';
    o.style.top = base.top + 'px';
    if (cls == '_margin-left') {
      if (length >= 0) {
        o.style.left = (base.left - length) + 'px';
        set_indicator(o, color, 'left');
      } else {
        o.style.left = base.left + 'px';
        set_indicator(o, color, 'right');
      }
    } else {
      if (length >= 0) {
        o.style.left = base.right + 'px';
        set_indicator(o, color, 'right');
      } else {
        o.style.left = (base.right + length) + 'px';
        set_indicator(o, color, 'left');
      }
    }

    o.style.width = Math.abs(length) + 'px';
    o.style.height = '16px';
    o.style.boxSizing = 'border-box';

    o.style.backgroundSize = '100% 1px';
    o.style.backgroundRepeat = 'no-repeat';
    o.style.backgroundPosition = 'left center';
    o.style.backgroundImage = `linear-gradient(to right, ${color}, ${color})`;

    const p = document.createElement('p');
    p.style.position = 'absolute';
    p.style.top = '-20px';
    p.style.left = 0;
    p.textContent = toFixedTrim(length, max_digits) + unit;
    p.style.fontSize = '12px';
    p.style.color = 'red';
    o.appendChild(p);
    document.body.appendChild(o);
    labelMap.set(o, target);
  }

  function refresh_margins() {
    document.querySelectorAll('._margin').forEach(o => {
      const target = labelMap.get(o);
      const base = target.getBoundingClientRect();
      o.style.top = base.top + 'px';

      const m = get_margin_values(target);
      const m_labels = toFixedTrim2(m[0], m[1], max_digits);
      let length, idx;
      if (o.classList.contains('_margin-left')) {
        length = m[0];
        idx = 0;
        o.style.width = length + 'px';
        if (length >= 0) {
          o.style.left = (base.left - length) + 'px';
          set_indicator(o, 'red', 'left');
        } else {
          o.style.left = base.left + 'px';
          set_indicator(o, 'blue', 'right');
        }
      } else {
        length = m[1];
        idx = 1;
        o.style.width = Math.abs(length) + 'px';
        if (length >= 0) {
          o.style.left = base.right + 'px';
          set_indicator(o, 'red', 'right');
        } else {
          o.style.left = (base.right + length) + 'px';
          set_indicator(o, 'blue', 'left');
        }
      }
      set_marker_color(o, (length >= 0)? 'red': 'blue');
      const p = o.querySelector('p');
      p.textContent = m_labels[idx] + unit;
      p.style.color = m_labels[2]? 'green': 'red';
    });
  }

  // https://codepen.io/kaz_hashimoto/pen/ZEJmQQK
  function toFixedTrim(val, max_digits) {
    if (Number.isInteger(val)) {
      return val.toString();
    }
    return val.toFixed(max_digits).replace(/0+$/, '').replace(/\.$/, '.0');
  }

  function toFixedTrim2(x, y, max_digits) {
    let digits = 0;
    let result;
    let equals = false;
    if (x === y) {
      equals = true;
      if (Number.isInteger(x)) { // 両方とも整数
        const n = x.toString();
        return [n, n, true];
      }
      // 両方とも小数
      // 固定小数表記での小数部分の桁数を取得
      digits = x.toString().split('.')[1].length;
    } else if (Number.isInteger(x) || Number.isInteger(y)) {
      // いずれか一方が整数
      result = [x, y].map(e => {
        if (Number.isInteger(e)) {
          return e.toString();
        }
        if (max_digits === undefined) {
          max_digits = 1;  // 片方が整数なので精度のmaxは落とす
        }
        digits = Math.min(max_digits, 10);
        return toFixedTrim(e, digits);
      });
      result.push(false);
      return result;
    } else {
      // 両方とも小数
      // 固定小数表記の桁数を増やした時に、結果に違いが現れる箇所の桁数を調べる
      for (digits = 1; digits <= 20; digits++) {
        const a = x.toFixed(digits);
        const b = y.toFixed(digits);
        if (a != b)
          break;
      }
     }
    // この時点で、digitsは最大桁数の候補
    if (max_digits !== undefined) {
      digits = Math.min(max_digits, digits);
    }
    result = [x, y].map(e => toFixedTrim(e, digits));
    result.push(equals);
    return result;
  }

  // Start
  scan_elements();
  window.addEventListener('scroll', function(evt) {
    refresh_margins();
  });

  window.addEventListener('resize', function(evt) {
    scan_elements();
    refresh_margins();
  });
});
