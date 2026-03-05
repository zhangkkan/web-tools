function exclude () {
    var resultData = document.getElementById('resultData');
    var excludedData = document.getElementById('excludedData');

    var originVal = document.getElementById('originData').value.trim();
    if (originVal == '') {
        resultData.value = '';
        excludedData.value = '';
        return false;
    }
    var o = {};
    var originArr = originVal.split('\n');
    var resultArr = [];
    var excludedArr = [];
    for (var i = 0; i < originArr.length; i++) {
        var line = originArr[i].trim();
        if (line === '') {
            continue;
        }
        if (!o.hasOwnProperty(line)) {
            o[line] = 1;
            resultArr.push(line);
        } else {
            excludedArr.push(line);
        }
    }

    resultData.value = resultArr.join('\n');
    excludedData.value = (excludedArr.length) ? excludedArr.join('\n') : '没有重复项';
}
