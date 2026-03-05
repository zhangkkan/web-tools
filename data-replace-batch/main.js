function replaceData() {
    var originData = document.getElementById('originData');
    var oldData = document.getElementById('oldData');
    var newData = document.getElementById('newData');
    var resultData = document.getElementById('resultData');

    var originVal = originData.value;
    var oldVal = oldData.value.trim();
    var newVal = newData.value.trim();

    // 校验输入是否为空
    if (originVal === '' || oldVal === '' || newVal === '') {
        resultData.value = '请输入所有必要的数据';
        return false;
    }

    // 分割 oldData 和 newData 为数组
    var oldArr = oldVal.split('\n');
    var newArr = newVal.split('\n');

    // 校验 oldData 和 newData 的行数是否一致
    if (oldArr.length !== newArr.length) {
        resultData.value = '错误：oldData 和 newData 的行数不一致';
        return false;
    }

    // 进行逐行替换
    var result = originVal;
    for (var i = 0; i < oldArr.length; i++) {
        var oldLine = oldArr[i].trim();
        var newLine = newArr[i].trim();
        // 使用正则表达式替换，确保替换整个匹配的字符串
        result = result.replace(new RegExp(oldLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newLine);
    }

    // 输出结果
    resultData.value = result;
}