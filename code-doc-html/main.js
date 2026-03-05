var domUtils = require('dom-utils');

var o = {
    tagsArr: [],
    docForm: document.getElementById('doc-form'),
    cssForm: document.getElementById('css-form'),
    optionsForm: document.getElementById('options-form'),
    htmlCodeWrap: document.getElementById('html-code-wrap'),
    htmlCode: document.getElementById('html-code'),
    defaultTags: 'h2, h3, h4, p:default',
    defaultCssCode: '#options-form h2 { font-weight: bold; font-size: 18px; }\n#options-form h3 { font-weight: bold; font-size: 14px; }\n#options-form h4 { font-weight: bold; font-size: 12px; }'
};

function escape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/[“”"]/g, '&quot;')
        .replace(/[‘’']/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getTagObj(str) {
    var obj = {};
    var tagName = str.match(/^[a-zA-Z\d]*/);
    if (tagName !== null) {
        obj.name = tagName[0];
    }
    var tagId = str.match(/#[a-zA-Z_\d\-]*/);
    if (tagId !== null) {
        obj.id = tagId[0].replace('#', '');
    }
    var tagClass = str.match(/\.[a-zA-Z_+\d\-]*/);
    if (tagClass !== null) {
        obj.class = tagClass[0].replace('.', '').replace(/\+/g, ' ');
    }
    if (str.indexOf(':default') !== -1) {
        obj.checked = true;
        obj.rule = str.replace(':default', '');
    } else {
        obj.rule = str;
    }

    obj.tagStart = '<' + obj.name + (obj.id ? ' id="' + obj.id + '"' : '') + (obj.class ? ' class="' + obj.class + '"' : '') + '>';
    obj.tagEnd = '</' + obj.name + '>';
    return obj;
}

function getTagsArr(str) {
    var arr = str.split(',');
    return arr.map(function (value) {
        return getTagObj(value.trim());
    });
}

function getOptionTr(line, lineIndex) {
    line = escape(line);
    var obj, defaultObj, labels = [], checked;
    for (var i = 0; i < o.tagsArr.length; i++) {
        obj = o.tagsArr[i];
        if (obj.checked) {
            checked = ' checked';
            defaultObj = obj;
        } else {
            checked = '';
        }
        labels.push('<label>');
        labels.push('<input class="tag-radio" type="radio" name="tag[' + lineIndex + ']" value="' + i + '"' + checked + '> ');
        labels.push(obj.rule);
        labels.push('</label>');
    }

    var tr = ['<tr>'];
    tr.push('<th>' + defaultObj.tagStart + line + defaultObj.tagEnd + '</th>');
    tr.push('<td class="td-tag">' + defaultObj.rule + '</td>');
    //radios
    tr.push('<td class="td-labels">' + labels.join('') + '</td>');
    //btns
    tr.push('<td>');

    tr.push('<input class="text" type="hidden" value="' + line + '">');
    tr.push('<button class="btn-no-style btn-insert" type="button">下方插入空行</button>');
    tr.push('<button class="btn-no-style btn-remove" type="button">删除行</button>');
    tr.push('</td>');
    tr.push('</tr>');
    return tr.join('');
}

function getBlankTr() {
    var tr = document.createElement('tr');
    var arr = [];
    arr.push('<td colspan="3" class="text-muted">&amp;nbsp;</td>');
    //btn
    arr.push('<td>');
    arr.push('<button class="btn-no-style btn-remove-blank" type="button">删除空行</button>');
    arr.push('</td>');
    tr.className = 'tr-blank';
    tr.innerHTML = arr.join('');
    return tr;
}

function execRadio(radio) {
    var tr = radio.parentNode.parentNode.parentNode;
    var obj = o.tagsArr[radio.value];
    tr.querySelector('th').innerHTML = obj.tagStart + tr.querySelector('input[type="hidden"]').value + obj.tagEnd;
}

function execSetCss(code) {
    var style = document.getElementById('custom-css');
    if (style) {
        style.innerHTML = code;
    } else {
        var style = document.createElement('style');
        style.id = 'custom-css';
        style.innerHTML = code;
        var head = document.getElementsByTagName('head')[0];
        head.appendChild(style);
    }
    window.localStorage.setItem('cssCode', code);
}

//绑定操作列表事件
function bindOptionsEvents() {
    o.optionsForm.onclick = function (ev) {
        ev = ev || window.event;
        var target = ev.target || ev.scrElement;
        if (target.type === 'radio') {
            //切换标签
            execRadio(target);
        } else if (domUtils.hasClass(target, 'btn-insert')) {
            //插入空行
            domUtils.insertAfter(target.parentNode.parentNode, getBlankTr());
        } else if (domUtils.hasClass(target, 'btn-remove-blank')) {
            //删除空行
            domUtils.removeNode(target.parentNode.parentNode);
        } else if (domUtils.hasClass(target, 'btn-remove')) {
            //删除空行
            domUtils.toggleClass(target.parentNode.parentNode, 'tr-removed');
        }
    };
}

o.docForm.onsubmit = function () {
    var form = this;
    var doc = form.doc.value.trim();
    var tags = form.tags.value.trim();
    if (doc === '') {
        form.doc.focus();
        return false;
    }
    if (tags === '') {
        form.tags.focus();
        return false;
    }
    var defaults = tags.match(/:default/g);
    if (defaults === null || defaults.length > 1) {
        alert('请检查:default标签，保证有且仅有一个');
        return false;
    }

    o.tagsArr = getTagsArr(tags);
    window.localStorage.setItem('tags', tags);
    execSetCss(form.cssCode.value.trim());

    var trs = [];
    var lines = doc.split('\n');
    var lineIndex = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line === '') {
            continue;
        }
        trs.push(getOptionTr(line, lineIndex));
        lineIndex++;
    }
    o.optionsForm.getElementsByTagName('table')[0].innerHTML = trs.join('');
    domUtils.removeClass(o.optionsForm, 'hide');
    bindOptionsEvents();
    window.scrollTo(0, o.optionsForm.offsetTop);
    return false;
};

function execMakeCode(isMakeHtml) {
    var trs = o.optionsForm.querySelectorAll('tr');
    var code = [];
    var lineIndex = 0;
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (domUtils.hasClass(tr, 'tr-removed')) {
            continue;
        } else if (domUtils.hasClass(tr, 'tr-blank')) {
            code.push('<p>&nbsp;</p>');
        } else {
            lineIndex++;
            var obj = o.tagsArr[tr.querySelector('input[type="radio"]:checked').value];
            var text = isMakeHtml ? escape(tr.querySelector('.text').value) : '{line' + lineIndex + '}';
            code.push(obj.tagStart + text + obj.tagEnd);
        }
    }

    o.htmlCode.value = code.join('\n');
    domUtils.removeClass(o.htmlCodeWrap, 'hide');
    window.scrollTo(0, o.htmlCodeWrap.offsetTop);
    return false;
};

document.getElementById('options-btn-html').onclick = function () {
    execMakeCode(true);
};
document.getElementById('options-btn-line').onclick = function () {
    execMakeCode(false);
};

document.getElementById('doc-btn-clear').onclick = function () {
    domUtils.addClass(o.optionsForm, 'hide');
    domUtils.addClass(o.htmlCodeWrap, 'hide');
    o.docForm.doc.value = '';
    o.docForm.doc.focus();
};

document.getElementById('doc-btn-default').onclick = function () {
    o.docForm.tags.value = o.defaultTags;
    o.docForm.cssCode.value = o.defaultCssCode;
};

window.onload = function () {
    var tags = o.defaultTags;
    var cssCode = o.defaultCssCode;
    if (window.localStorage) {
        if (window.localStorage.tags !== undefined) {
            tags = window.localStorage.tags;
        }
        if (window.localStorage.cssCode !== undefined) {
            cssCode = window.localStorage.cssCode;
        }
    }
    o.docForm.tags.value = tags;
    o.docForm.cssCode.value = cssCode;

    //复制
    require('api-clipboard').set('html-code-btn', 'html-code');
};
