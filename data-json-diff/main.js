function initJsonDiffTool() {
    document.getElementById('jsonInputA').value = '{\n  "orderNo": "SO-1001",\n  "amount": 329.5,\n  "status": "paid",\n  "items": [\n    {"sku": "A-001", "qty": 2},\n    {"sku": "A-002", "qty": 1}\n  ],\n  "ext": {"channel": "app"}\n}';

    document.getElementById('jsonInputB').value = '{\n  "orderNo": "SO-1001",\n  "amount": 319.5,\n  "status": "shipped",\n  "items": [\n    {"sku": "A-001", "qty": 2},\n    {"sku": "A-003", "qty": 1}\n  ],\n  "ext": {"channel": "mini", "coupon": "WELCOME"}\n}';
}

function goCompare() {
    clearErrors();

    var inputA = document.getElementById('jsonInputA');
    var inputB = document.getElementById('jsonInputB');
    var parseA = parseJson(inputA.value, 'errorA', 'JSON A');
    var parseB = parseJson(inputB.value, 'errorB', 'JSON B');

    if (!parseA.valid || !parseB.valid) {
        return false;
    }

    inputA.value = JSON.stringify(parseA.data, null, 2);
    inputB.value = JSON.stringify(parseB.data, null, 2);

    var leftDiffs = [];
    var rightDiffs = [];
    walkDiff(parseA.data, parseB.data, [], leftDiffs, rightDiffs);

    renderResults(leftDiffs, rightDiffs);
    switchView('result');
    return false;
}

function goEdit() {
    switchView('edit');
}

function swapInputs() {
    clearErrors();
    var inputA = document.getElementById('jsonInputA');
    var inputB = document.getElementById('jsonInputB');
    var temp = inputA.value;
    inputA.value = inputB.value;
    inputB.value = temp;
}

function clearInputs() {
    clearErrors();
    document.getElementById('jsonInputA').value = '';
    document.getElementById('jsonInputB').value = '';
    document.getElementById('jsonInputA').focus();
}

function switchView(type) {
    var inputView = document.getElementById('inputView');
    var resultView = document.getElementById('resultView');

    if (type === 'result') {
        inputView.className = 'panel-a form-a hide';
        resultView.className = 'panel-a';
    } else {
        inputView.className = 'panel-a form-a';
        resultView.className = 'panel-a hide';
    }
}

function clearErrors() {
    document.getElementById('errorA').innerHTML = '';
    document.getElementById('errorB').innerHTML = '';
}

function parseJson(rawText, errorId, fieldName) {
    var text = rawText.trim();
    if (text === '') {
        showError(errorId, fieldName + ' 不能为空');
        return { valid: false, data: null };
    }

    try {
        return {
            valid: true,
            data: JSON.parse(text)
        };
    } catch (err) {
        showError(errorId, fieldName + ' 格式错误：' + escapeHtml(err.message));
        return { valid: false, data: null };
    }
}

function showError(errorId, message) {
    document.getElementById(errorId).innerHTML = message;
}

function walkDiff(leftValue, rightValue, pathArr, leftDiffs, rightDiffs) {
    var leftType = detectType(leftValue);
    var rightType = detectType(rightValue);

    if (leftType !== rightType) {
        pushDiff(leftDiffs, pathArr, leftValue, rightValue, '类型不一致', 'type');
        pushDiff(rightDiffs, pathArr, rightValue, leftValue, '类型不一致', 'type');
        return;
    }

    if (leftType === 'object') {
        compareObject(leftValue, rightValue, pathArr, leftDiffs, rightDiffs);
        return;
    }

    if (leftType === 'array') {
        compareArray(leftValue, rightValue, pathArr, leftDiffs, rightDiffs);
        return;
    }

    if (leftValue !== rightValue) {
        pushDiff(leftDiffs, pathArr, leftValue, rightValue, '值不一致', 'value');
        pushDiff(rightDiffs, pathArr, rightValue, leftValue, '值不一致', 'value');
    }
}

function compareObject(leftObj, rightObj, pathArr, leftDiffs, rightDiffs) {
    var keyMap = {};
    var key;

    for (key in leftObj) {
        if (leftObj.hasOwnProperty(key)) {
            keyMap[key] = 1;
        }
    }
    for (key in rightObj) {
        if (rightObj.hasOwnProperty(key)) {
            keyMap[key] = 1;
        }
    }

    var keyArr = [];
    for (key in keyMap) {
        if (keyMap.hasOwnProperty(key)) {
            keyArr.push(key);
        }
    }
    keyArr.sort();

    for (var i = 0; i < keyArr.length; i++) {
        key = keyArr[i];
        var nextPath = pathArr.concat(key);
        var hasLeft = leftObj.hasOwnProperty(key);
        var hasRight = rightObj.hasOwnProperty(key);

        if (hasLeft && !hasRight) {
            pushDiff(leftDiffs, nextPath, leftObj[key], undefined, '仅 JSON A 存在', 'missing');
            pushDiff(rightDiffs, nextPath, undefined, leftObj[key], 'JSON B 缺失该字段', 'missing');
            continue;
        }

        if (!hasLeft && hasRight) {
            pushDiff(leftDiffs, nextPath, undefined, rightObj[key], 'JSON A 缺失该字段', 'missing');
            pushDiff(rightDiffs, nextPath, rightObj[key], undefined, '仅 JSON B 存在', 'missing');
            continue;
        }

        walkDiff(leftObj[key], rightObj[key], nextPath, leftDiffs, rightDiffs);
    }
}

function compareArray(leftArr, rightArr, pathArr, leftDiffs, rightDiffs) {
    var maxLength = Math.max(leftArr.length, rightArr.length);

    for (var i = 0; i < maxLength; i++) {
        var nextPath = pathArr.concat(i);
        var hasLeft = i < leftArr.length;
        var hasRight = i < rightArr.length;

        if (hasLeft && !hasRight) {
            pushDiff(leftDiffs, nextPath, leftArr[i], undefined, '仅 JSON A 存在', 'missing');
            pushDiff(rightDiffs, nextPath, undefined, leftArr[i], 'JSON B 缺失该索引', 'missing');
            continue;
        }

        if (!hasLeft && hasRight) {
            pushDiff(leftDiffs, nextPath, undefined, rightArr[i], 'JSON A 缺失该索引', 'missing');
            pushDiff(rightDiffs, nextPath, rightArr[i], undefined, '仅 JSON B 存在', 'missing');
            continue;
        }

        walkDiff(leftArr[i], rightArr[i], nextPath, leftDiffs, rightDiffs);
    }
}

function pushDiff(diffArr, pathArr, value, peerValue, reason, styleType) {
    diffArr.push({
        path: pathToString(pathArr),
        value: value,
        peerValue: peerValue,
        reason: reason,
        styleType: styleType
    });
}

function renderResults(leftDiffs, rightDiffs) {
    var total = leftDiffs.length;
    document.getElementById('resultTitle').innerHTML = '<strong>对比完成</strong> · 已找到 ' + total + ' 处差异';
    document.getElementById('statTotal').innerHTML = '总差异: ' + total;
    document.getElementById('statLeft').innerHTML = 'A 侧记录: ' + leftDiffs.length;
    document.getElementById('statRight').innerHTML = 'B 侧记录: ' + rightDiffs.length;

    renderDiffList('diffListA', leftDiffs, 'JSON A 与 B 完全一致');
    renderDiffList('diffListB', rightDiffs, 'JSON B 与 A 完全一致');
}

function renderDiffList(containerId, diffArr, emptyText) {
    var html = '';

    if (!diffArr.length) {
        html = '<div class="empty-state">' + emptyText + '</div>';
    } else {
        for (var i = 0; i < diffArr.length; i++) {
            var item = diffArr[i];
            html += '<details class="diff-item ' + item.styleType + '" open>';
            html += '<summary>';
            html += '<span class="diff-path">' + escapeHtml(item.path) + '</span>';
            html += '<span class="diff-reason">' + escapeHtml(item.reason) + '</span>';
            html += '</summary>';
            html += '<div class="diff-body">' + buildDiffBodyHtml(item) + '</div>';
            html += '</details>';
        }
    }

    document.getElementById(containerId).innerHTML = html;
}

function buildDiffBodyHtml(item) {
    var currentVal = formatValue(item.value);
    var peerVal = formatValue(item.peerValue);
    var inlineDiff = buildInlineDiff(currentVal, peerVal);
    var html = '';

    html += '<div class="inline-line">';
    html += '<p class="label">当前值</p>';
    html += '<pre class="line-minus"><span class="line-prefix">-</span>' + inlineDiff.leftHtml + '</pre>';
    html += '</div>';

    html += '<div class="inline-line">';
    html += '<p class="label">对方值</p>';
    html += '<pre class="line-plus"><span class="line-prefix">+</span>' + inlineDiff.rightHtml + '</pre>';
    html += '</div>';

    return html;
}

function buildInlineDiff(leftText, rightText) {
    var left = String(leftText);
    var right = String(rightText);
    var leftLength = left.length;
    var rightLength = right.length;
    var start = 0;

    while (start < leftLength && start < rightLength && left.charAt(start) === right.charAt(start)) {
        start++;
    }

    var endLeft = leftLength - 1;
    var endRight = rightLength - 1;
    while (endLeft >= start && endRight >= start && left.charAt(endLeft) === right.charAt(endRight)) {
        endLeft--;
        endRight--;
    }

    var leftPrefix = left.substring(0, start);
    var rightPrefix = right.substring(0, start);
    var leftMiddle = left.substring(start, endLeft + 1);
    var rightMiddle = right.substring(start, endRight + 1);
    var leftSuffix = left.substring(endLeft + 1);
    var rightSuffix = right.substring(endRight + 1);

    return {
        leftHtml: escapeHtml(leftPrefix) + wrapInline(leftMiddle, 'inline-del') + escapeHtml(leftSuffix),
        rightHtml: escapeHtml(rightPrefix) + wrapInline(rightMiddle, 'inline-add') + escapeHtml(rightSuffix)
    };
}

function wrapInline(text, cls) {
    if (text === '') {
        return '';
    }
    return '<span class="' + cls + '">' + escapeHtml(text) + '</span>';
}

function toggleAllNodes(expand) {
    var details = document.querySelectorAll('.diff-list details');
    for (var i = 0; i < details.length; i++) {
        details[i].open = expand;
    }
}

function formatValue(value) {
    if (typeof value === 'undefined') {
        return '(缺失)';
    }
    if (typeof value === 'string') {
        return '"' + value + '"';
    }
    return JSON.stringify(value, null, 2);
}

function detectType(value) {
    if (value === null) {
        return 'null';
    }
    if (value instanceof Array) {
        return 'array';
    }
    return typeof value;
}

function pathToString(pathArr) {
    if (!pathArr.length) {
        return '$';
    }

    var result = '$';
    for (var i = 0; i < pathArr.length; i++) {
        var key = pathArr[i];
        if (typeof key === 'number') {
            result += '[' + key + ']';
        } else if (/^[A-Za-z_$][\w$]*$/.test(key)) {
            result += '.' + key;
        } else {
            result += '["' + key.replace(/"/g, '\\"') + '"]';
        }
    }
    return result;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
