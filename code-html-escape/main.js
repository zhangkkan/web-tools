//转义
function htmlEscape() {
    var originalTxt = document.getElementById("original").value.trim();
    if (originalTxt !== '') {
        var resultTxt = originalTxt
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\\/g, '&#92;');
        document.getElementById("result").innerText = resultTxt;
    }
}

//清空textarea，转义前textarea获取焦点
function clearData() {
    var original = document.getElementById('original');
    var result = document.getElementById('result');
    original.value = '';
    result.innerText = '';
    original.focus();
}