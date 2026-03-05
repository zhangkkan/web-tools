function strToObj (originStr) {
    var originArr = originStr.trim().split('\n');
    var obj = {}, arr = [];
    for (var i = 0; i < originArr.length; i++) {
        var key = originArr[i].trim();
        if (key !== '' && !obj.hasOwnProperty(key)) {
            obj[key] = 1;
            arr.push(key);
        }
    }
    return {
        arr: arr,
        obj: obj
    };
}

function diff () {
    var originData1 = document.getElementById('originData1');
    var originData2 = document.getElementById('originData2');

    //字符串拆分后转成对象
    var origin1 = strToObj(originData1.value);
    var origin2 = strToObj(originData2.value);

    var diffArr1 = [], diffArr2 = [], i, key;
    for (i = 0; i < origin1.arr.length; i++) {
        key = origin1.arr[i];
        if(!origin2.obj.hasOwnProperty(key)) {
            diffArr1.push(key);
        }
    }
    for (i = 0; i < origin2.arr.length; i++) {
        key = origin2.arr[i];
        if(!origin1.obj.hasOwnProperty(key)) {
            diffArr2.push(key);
        }
    }

    originData1.value = origin1.arr.join('\n');
    originData2.value = origin2.arr.join('\n');
    document.getElementById('diffData1').value = diffArr1.length ? diffArr1.join('\n') : '数组一没有多出的数据';
    document.getElementById('diffData2').value = diffArr2.length ? diffArr2.join('\n') : '数组二没有多出的数据';
}