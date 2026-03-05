function initJsonPathTool() {
    document.getElementById('jsonInput').value = '{\n  "orderNo": "SO-1001",\n  "amount": 329.5,\n  "status": "paid",\n  "items": [\n    {"sku": "A-001", "qty": 2},\n    {"sku": "A-002", "qty": 1}\n  ],\n  "ext": {"channel": "app", "coupon": null}\n}';
    extractPaths();
}

function extractPaths() {
    clearError();

    var inputEl = document.getElementById('jsonInput');
    var outputEl = document.getElementById('pathOutput');
    var countLabel = document.getElementById('countLabel');
    var leafOnly = document.getElementById('leafOnly').checked;
    var rawText = inputEl.value.trim();

    if (rawText === '') {
        outputEl.value = '';
        countLabel.innerHTML = '共 0 条路径';
        showError('请输入 JSON');
        return false;
    }

    try {
        var jsonObj = JSON.parse(rawText);
        var pathArr = [];
        collectJsonPath(jsonObj, '$', pathArr, leafOnly);
        outputEl.value = pathArr.join('\n');
        countLabel.innerHTML = '共 ' + pathArr.length + ' 条路径';
        return true;
    } catch (err) {
        outputEl.value = '';
        countLabel.innerHTML = '共 0 条路径';
        showError('JSON 格式错误：' + err.message);
        return false;
    }
}

function collectJsonPath(value, path, pathArr, leafOnly) {
    var valueType = detectType(value);
    var keyArr;
    var i;

    if (leafOnly) {
        if (valueType !== 'object' && valueType !== 'array') {
            pathArr.push(path);
            return;
        }
        if (valueType === 'object') {
            keyArr = Object.keys(value);
            if (!keyArr.length) {
                pathArr.push(path);
                return;
            }
            for (i = 0; i < keyArr.length; i++) {
                collectJsonPath(value[keyArr[i]], buildObjectPath(path, keyArr[i]), pathArr, true);
            }
            return;
        }

        if (!value.length) {
            pathArr.push(path);
            return;
        }
        for (i = 0; i < value.length; i++) {
            collectJsonPath(value[i], path + '[' + i + ']', pathArr, true);
        }
        return;
    }

    pathArr.push(path);
    if (valueType === 'object') {
        keyArr = Object.keys(value);
        for (i = 0; i < keyArr.length; i++) {
            collectJsonPath(value[keyArr[i]], buildObjectPath(path, keyArr[i]), pathArr, false);
        }
        return;
    }

    if (valueType === 'array') {
        for (i = 0; i < value.length; i++) {
            collectJsonPath(value[i], path + '[' + i + ']', pathArr, false);
        }
    }
}

function buildObjectPath(basePath, key) {
    if (/^[A-Za-z_$][\w$]*$/.test(key)) {
        return basePath + '.' + key;
    }
    return basePath + '["' + String(key).replace(/"/g, '\\"') + '"]';
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

function formatJsonInput() {
    clearError();
    var inputEl = document.getElementById('jsonInput');
    var rawText = inputEl.value.trim();
    if (rawText === '') {
        showError('请输入 JSON');
        return false;
    }

    try {
        var obj = JSON.parse(rawText);
        inputEl.value = JSON.stringify(obj, null, 2);
        extractPaths();
        return true;
    } catch (err) {
        showError('JSON 格式错误：' + err.message);
        return false;
    }
}

function clearAll() {
    clearError();
    document.getElementById('jsonInput').value = '';
    document.getElementById('pathOutput').value = '';
    document.getElementById('countLabel').innerHTML = '共 0 条路径';
    document.getElementById('jsonInput').focus();
}

function showError(msg) {
    document.getElementById('errorMsg').innerHTML = msg;
}

function clearError() {
    document.getElementById('errorMsg').innerHTML = '';
}
