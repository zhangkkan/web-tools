function initMarkedJsonDiffTool() {
    document.getElementById('jsonInputA').value = '{\n  "orderNo": "SO-1001",\n  "amount": 329.5,\n  "status": "paid",\n  "items": [\n    {"sku": "A-001", "qty": 2},\n    {"sku": "A-002", "qty": 1}\n  ],\n  "ext": {"channel": "app"}\n}';

    document.getElementById('jsonInputB').value = '{\n  "orderNo": "SO-1001",\n  "amount": 319.5,\n  "status": "shipped",\n  "items": [\n    {"sku": "A-001", "qty": 2},\n    {"sku": "A-003", "qty": 1}\n  ],\n  "ext": {"channel": "mini", "coupon": "WELCOME"}\n}';
}

var markedState = {
    paths: [],
    index: -1,
    syncScroll: true,
    syncing: false,
    hasBound: false
};

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

    renderResults(parseA.data, parseB.data, leftDiffs, rightDiffs);
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
        inputView.className = 'layout-view form-a hide';
        resultView.className = 'layout-view';
    } else {
        inputView.className = 'layout-view form-a';
        resultView.className = 'layout-view hide';
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

function renderResults(leftJson, rightJson, leftDiffs, rightDiffs) {
    var total = leftDiffs.length;
    document.getElementById('resultTitle').innerHTML = '<strong>对比完成</strong> · 已找到 ' + total + ' 处差异';
    document.getElementById('statTotal').innerHTML = '总差异: ' + total;
    document.getElementById('statLeft').innerHTML = 'A 侧标签: ' + leftDiffs.length;
    document.getElementById('statRight').innerHTML = 'B 侧标签: ' + rightDiffs.length;

    renderTagList('tagListA', leftDiffs);
    renderTagList('tagListB', rightDiffs);
    renderJsonView('jsonResultA', leftJson, leftDiffs);
    renderJsonView('jsonResultB', rightJson, rightDiffs);
    initResultInteractions();
    buildPathNavigator(leftDiffs, rightDiffs);

    document.getElementById('optOnlyDiff').checked = false;
    toggleOnlyDiff(false);
    document.getElementById('optSyncScroll').checked = true;
    toggleSyncScroll(true);
}

function renderTagList(containerId, diffArr) {
    if (!diffArr.length) {
        document.getElementById(containerId).innerHTML = '<span class="tag-empty">该侧无差异</span>';
        return;
    }

    var html = '';
    for (var i = 0; i < diffArr.length; i++) {
        var item = diffArr[i];
        html += '<span class="tag ' + item.styleType + '" data-path="' + escapeHtml(item.path) + '">' + escapeHtml(item.path + ' · ' + item.reason) + '</span>';
    }
    document.getElementById(containerId).innerHTML = html;
}

function renderJsonView(containerId, jsonObj, diffArr) {
    var diffMap = buildDiffMap(diffArr);
    var lines = [];

    renderRootNode(jsonObj, [], 0, lines, diffMap);
    document.getElementById(containerId).innerHTML = lines.join('');
}

function buildDiffMap(diffArr) {
    var diffMap = {};
    for (var i = 0; i < diffArr.length; i++) {
        var item = diffArr[i];
        if (!diffMap[item.path]) {
            diffMap[item.path] = {
                styleType: item.styleType,
                reasonMap: {}
            };
        } else {
            diffMap[item.path].styleType = pickStrongStyle(diffMap[item.path].styleType, item.styleType);
        }
        diffMap[item.path].reasonMap[item.reason] = 1;
    }

    var path;
    for (path in diffMap) {
        if (diffMap.hasOwnProperty(path)) {
            diffMap[path].reasonText = getReasonText(diffMap[path].reasonMap);
        }
    }
    return diffMap;
}

function pickStrongStyle(oldStyle, newStyle) {
    var weightMap = {
        value: 1,
        type: 2,
        missing: 3
    };
    return weightMap[newStyle] > weightMap[oldStyle] ? newStyle : oldStyle;
}

function getReasonText(reasonMap) {
    var reasonArr = [];
    var key;
    for (key in reasonMap) {
        if (reasonMap.hasOwnProperty(key)) {
            reasonArr.push(key);
        }
    }
    return reasonArr.join('、');
}

function renderRootNode(value, pathArr, level, lines, diffMap) {
    var type = detectType(value);
    if (type === 'object') {
        renderObjectNode(value, pathArr, level, lines, diffMap, false);
        return;
    }
    if (type === 'array') {
        renderArrayNode(value, pathArr, level, lines, diffMap, false);
        return;
    }
    appendLine(lines, level, formatPrimitive(value), pathArr, diffMap);
}

function renderObjectNode(obj, pathArr, level, lines, diffMap, withComma) {
    appendLine(lines, level, '{', pathArr, diffMap);

    var keyArr = Object.keys(obj);
    for (var i = 0; i < keyArr.length; i++) {
        var key = keyArr[i];
        var childValue = obj[key];
        var childPath = pathArr.concat(key);
        var isLast = i === keyArr.length - 1;
        renderProperty(key, childValue, childPath, level + 1, lines, diffMap, !isLast);
    }

    appendLine(lines, level, '}' + (withComma ? ',' : ''), pathArr, diffMap);
}

function renderArrayNode(arr, pathArr, level, lines, diffMap, withComma) {
    appendLine(lines, level, '[', pathArr, diffMap);

    for (var i = 0; i < arr.length; i++) {
        var childValue = arr[i];
        var childPath = pathArr.concat(i);
        var isLast = i === arr.length - 1;
        renderArrayItem(childValue, childPath, level + 1, lines, diffMap, !isLast);
    }

    appendLine(lines, level, ']' + (withComma ? ',' : ''), pathArr, diffMap);
}

function renderProperty(key, value, pathArr, level, lines, diffMap, withComma) {
    var valueType = detectType(value);
    var keyPrefix = JSON.stringify(key) + ': ';

    if (valueType === 'object') {
        appendLine(lines, level, keyPrefix + '{', pathArr, diffMap);
        var keyArr = Object.keys(value);
        for (var i = 0; i < keyArr.length; i++) {
            var childKey = keyArr[i];
            var childPath = pathArr.concat(childKey);
            var isLast = i === keyArr.length - 1;
            renderProperty(childKey, value[childKey], childPath, level + 1, lines, diffMap, !isLast);
        }
        appendLine(lines, level, '}' + (withComma ? ',' : ''), pathArr, diffMap);
        return;
    }

    if (valueType === 'array') {
        appendLine(lines, level, keyPrefix + '[', pathArr, diffMap);
        for (var idx = 0; idx < value.length; idx++) {
            var childVal = value[idx];
            var arrPath = pathArr.concat(idx);
            var arrIsLast = idx === value.length - 1;
            renderArrayItem(childVal, arrPath, level + 1, lines, diffMap, !arrIsLast);
        }
        appendLine(lines, level, ']' + (withComma ? ',' : ''), pathArr, diffMap);
        return;
    }

    appendLine(lines, level, keyPrefix + formatPrimitive(value) + (withComma ? ',' : ''), pathArr, diffMap);
}

function renderArrayItem(value, pathArr, level, lines, diffMap, withComma) {
    var valueType = detectType(value);

    if (valueType === 'object') {
        renderObjectNode(value, pathArr, level, lines, diffMap, withComma);
        return;
    }
    if (valueType === 'array') {
        renderArrayNode(value, pathArr, level, lines, diffMap, withComma);
        return;
    }

    appendLine(lines, level, formatPrimitive(value) + (withComma ? ',' : ''), pathArr, diffMap);
}

function appendLine(lines, level, lineText, pathArr, diffMap) {
    var path = pathToString(pathArr);
    var diffMeta = diffMap[path];
    var lineClass = 'json-line normal';
    var badgeHtml = '';
    var indent = repeatIndent(level);
    var lineAttrs = ' data-path="' + escapeHtml(path) + '"';

    if (diffMeta) {
        lineClass = 'json-line diff mark-' + diffMeta.styleType;
        badgeHtml = '<span class="badge">' + escapeHtml(diffMeta.reasonText) + '</span>';
        lineAttrs += ' data-diff="1"';
    }

    lines.push('<div class="' + lineClass + '"' + lineAttrs + '><span class="code">' + escapeHtml(indent + lineText) + '</span>' + badgeHtml + '</div>');
}

function initResultInteractions() {
    if (markedState.hasBound) {
        return;
    }

    bindScrollSync('jsonResultA', 'jsonResultB');
    bindScrollSync('jsonResultB', 'jsonResultA');
    bindTagClick('tagListA');
    bindTagClick('tagListB');
    markedState.hasBound = true;
}

function bindScrollSync(fromId, toId) {
    var fromEl = document.getElementById(fromId);
    var toEl = document.getElementById(toId);
    fromEl.addEventListener('scroll', function () {
        if (!markedState.syncScroll || markedState.syncing) {
            return;
        }
        markedState.syncing = true;
        toEl.scrollTop = fromEl.scrollTop;
        setTimeout(function () {
            markedState.syncing = false;
        }, 0);
    });
}

function bindTagClick(containerId) {
    var container = document.getElementById(containerId);
    container.addEventListener('click', function (event) {
        var node = event.target;
        while (node && node !== container && !node.getAttribute('data-path')) {
            node = node.parentNode;
        }
        if (node && node.getAttribute('data-path')) {
            jumpToPath(node.getAttribute('data-path'));
        }
    });
}

function buildPathNavigator(leftDiffs, rightDiffs) {
    var pathMap = {};
    var pathArr = [];

    collectPath(leftDiffs, pathMap, pathArr);
    collectPath(rightDiffs, pathMap, pathArr);

    markedState.paths = pathArr;
    markedState.index = pathArr.length ? 0 : -1;
    updateNavLabel();

    if (pathArr.length) {
        applyPathSelection(pathArr[0], true);
    } else {
        clearPathSelection();
    }
}

function collectPath(diffArr, pathMap, pathArr) {
    for (var i = 0; i < diffArr.length; i++) {
        var path = diffArr[i].path;
        if (!pathMap[path]) {
            pathMap[path] = 1;
            pathArr.push(path);
        }
    }
}

function goPrevDiff() {
    if (!markedState.paths.length) {
        return;
    }
    markedState.index = markedState.index <= 0 ? markedState.paths.length - 1 : markedState.index - 1;
    applyPathSelection(markedState.paths[markedState.index], true);
    updateNavLabel();
}

function goNextDiff() {
    if (!markedState.paths.length) {
        return;
    }
    markedState.index = markedState.index >= markedState.paths.length - 1 ? 0 : markedState.index + 1;
    applyPathSelection(markedState.paths[markedState.index], true);
    updateNavLabel();
}

function jumpToPath(path) {
    var index = findPathIndex(path);
    if (index === -1) {
        return;
    }
    markedState.index = index;
    applyPathSelection(path, true);
    updateNavLabel();
}

function findPathIndex(path) {
    for (var i = 0; i < markedState.paths.length; i++) {
        if (markedState.paths[i] === path) {
            return i;
        }
    }
    return -1;
}

function applyPathSelection(path, scrollIntoView) {
    clearPathSelection();
    markTagSelected('tagListA', path);
    markTagSelected('tagListB', path);

    var leftFirst = markLineSelected('jsonResultA', path);
    var rightFirst = markLineSelected('jsonResultB', path);
    if (scrollIntoView) {
        if (leftFirst) {
            scrollLineIntoView('jsonResultA', leftFirst);
        }
        if (rightFirst) {
            scrollLineIntoView('jsonResultB', rightFirst);
        }
    }
}

function clearPathSelection() {
    removeClassFromNodes('#tagListA .tag.selected', 'selected');
    removeClassFromNodes('#tagListB .tag.selected', 'selected');
    removeClassFromNodes('#jsonResultA .json-line.selected-line', 'selected-line');
    removeClassFromNodes('#jsonResultB .json-line.selected-line', 'selected-line');
}

function removeClassFromNodes(selector, cls) {
    var nodeList = document.querySelectorAll(selector);
    for (var i = 0; i < nodeList.length; i++) {
        nodeList[i].classList.remove(cls);
    }
}

function markTagSelected(containerId, path) {
    var tags = document.getElementById(containerId).querySelectorAll('.tag');
    for (var i = 0; i < tags.length; i++) {
        if (tags[i].getAttribute('data-path') === path) {
            tags[i].classList.add('selected');
        }
    }
}

function markLineSelected(containerId, path) {
    var lines = document.getElementById(containerId).querySelectorAll('.json-line');
    var firstMatched = null;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].getAttribute('data-path') === path) {
            lines[i].classList.add('selected-line');
            if (!firstMatched) {
                firstMatched = lines[i];
            }
        }
    }
    return firstMatched;
}

function scrollLineIntoView(containerId, lineEl) {
    var container = document.getElementById(containerId);
    var top = lineEl.offsetTop - 80;
    if (top < 0) {
        top = 0;
    }
    container.scrollTop = top;
}

function updateNavLabel() {
    var total = markedState.paths.length;
    var current = total ? markedState.index + 1 : 0;
    document.getElementById('navLabel').innerHTML = current + ' / ' + total;
}

function toggleOnlyDiff(checked) {
    var leftEl = document.getElementById('jsonResultA');
    var rightEl = document.getElementById('jsonResultB');
    leftEl.className = checked ? 'json-view only-diff' : 'json-view';
    rightEl.className = checked ? 'json-view only-diff' : 'json-view';
}

function toggleSyncScroll(checked) {
    markedState.syncScroll = checked;
}

function formatPrimitive(value) {
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string') {
        return JSON.stringify(value);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return JSON.stringify(value);
}

function repeatIndent(level) {
    var result = '';
    for (var i = 0; i < level; i++) {
        result += '  ';
    }
    return result;
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
