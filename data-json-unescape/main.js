function initJsonUnescapeTool() {
    document.getElementById('inputData').value = '"{\\"orderNo\\":\\"SO-1001\\",\\"amount\\":329.5,\\"ext\\":\\"{\\\\\\"channel\\\\\\":\\\\\\"app\\\\\\"}\\"}"';
}

function unescapeAndFormat() {
    clearError();
    clearTips();
    var raw = getInputText();
    if (raw === '') {
        showError('请输入需要处理的内容');
        return false;
    }

    try {
        var baseValue = parseInputToValue(raw);
        var deepParse = document.getElementById('deepParse').checked;
        var normalized = normalizeValue(baseValue, deepParse);

        // 最终要求输出合法 JSON
        if (typeof normalized === 'string') {
            var parsed = tryParseJson(normalized.trim());
            if (parsed.ok) {
                normalized = parsed.value;
            } else {
                throw new Error('去转义完成，但结果不是 JSON 结构，请检查输入内容');
            }
        }

        document.getElementById('outputData').value = JSON.stringify(normalized, null, 2);
        return true;
    } catch (err) {
        showError(err.message);
        return false;
    }
}

function unescapeOnly() {
    clearError();
    clearTips();
    var raw = getInputText();
    if (raw === '') {
        showError('请输入需要处理的内容');
        return false;
    }

    try {
        var baseValue = parseInputToValue(raw);
        var deepParse = document.getElementById('deepParse').checked;
        var normalized = normalizeValue(baseValue, deepParse);
        if (typeof normalized === 'string') {
            document.getElementById('outputData').value = normalized;
        } else {
            document.getElementById('outputData').value = JSON.stringify(normalized, null, 2);
        }
        return true;
    } catch (err) {
        showError(err.message);
        return false;
    }
}

function getInputText() {
    return document.getElementById('inputData').value.trim();
}

function parseInputToValue(raw) {
    var direct = tryParseJson(raw);
    if (direct.ok) {
        return direct.value;
    }

    var decoded = decodeEscapedString(raw);
    if (decoded.ok) {
        return decoded.value;
    }

    throw new Error('输入内容无法识别为 JSON 或 JSON 字符串');
}

function normalizeValue(value, deepParse) {
    var normalized = unwrapStringValue(value, 0);
    if (deepParse) {
        normalized = deepNormalize(normalized, 0);
    }
    return normalized;
}

function unwrapStringValue(value, depth) {
    if (depth > 8 || typeof value !== 'string') {
        return value;
    }

    var text = value.trim();
    if (text === '') {
        return value;
    }

    var parsed = tryParseJson(text);
    if (parsed.ok) {
        return unwrapStringValue(parsed.value, depth + 1);
    }

    var decoded = decodeEscapedString(text);
    if (decoded.ok && decoded.value !== value) {
        return unwrapStringValue(decoded.value, depth + 1);
    }

    return value;
}

function deepNormalize(value, depth) {
    if (depth > 10) {
        return value;
    }

    var valueType = detectType(value);
    var i;
    if (valueType === 'array') {
        var arr = [];
        for (i = 0; i < value.length; i++) {
            arr.push(deepNormalize(unwrapStringValue(value[i], 0), depth + 1));
        }
        return arr;
    }

    if (valueType === 'object') {
        var obj = {};
        var keys = Object.keys(value);
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            obj[key] = deepNormalize(unwrapStringValue(value[key], 0), depth + 1);
        }
        return obj;
    }

    return unwrapStringValue(value, 0);
}

function decodeEscapedString(text) {
    var candidates = [text];
    if (!isDoubleQuoted(text)) {
        candidates.push('"' + escapeForJsonString(text) + '"');
    }

    for (var i = 0; i < candidates.length; i++) {
        var parsed = tryParseJson(candidates[i]);
        if (parsed.ok && typeof parsed.value === 'string') {
            return {
                ok: true,
                value: parsed.value
            };
        }
    }

    return {
        ok: false
    };
}

function tryParseJson(text) {
    try {
        return {
            ok: true,
            value: JSON.parse(text)
        };
    } catch (err) {
        return {
            ok: false,
            err: err
        };
    }
}

function isDoubleQuoted(text) {
    return text.length >= 2 && text.charAt(0) === '"' && text.charAt(text.length - 1) === '"';
}

function escapeForJsonString(text) {
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
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

function clearAll() {
    clearError();
    clearTips();
    document.getElementById('inputData').value = '';
    document.getElementById('outputData').value = '';
    document.getElementById('inputData').focus();
}

function clearResult() {
    clearError();
    clearTips();
    document.getElementById('outputData').value = '';
}

function copyResult() {
    clearError();
    clearTips();

    var outputEl = document.getElementById('outputData');
    var text = outputEl.value;
    if (text.trim() === '') {
        showError('没有可复制的结果');
        return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            showTips('复制成功');
        }).catch(function () {
            copyByExecCommand(outputEl);
        });
        return true;
    }

    return copyByExecCommand(outputEl);
}

function copyByExecCommand(el) {
    try {
        el.focus();
        el.select();
        var ok = document.execCommand('copy');
        if (ok) {
            showTips('复制成功');
            return true;
        }
        showError('复制失败，请手动复制');
        return false;
    } catch (err) {
        showError('复制失败，请手动复制');
        return false;
    }
}

function showError(msg) {
    document.getElementById('errorMsg').innerHTML = msg;
}

function clearError() {
    document.getElementById('errorMsg').innerHTML = '';
}

function showTips(msg) {
    document.getElementById('copyTips').innerHTML = msg;
}

function clearTips() {
    document.getElementById('copyTips').innerHTML = '';
}
