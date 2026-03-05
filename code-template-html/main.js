function makeHtml () {
    var template = document.getElementById('template').value.trim();
    var doc = document.getElementById('doc').value.trim();
    if (template === '' || doc === '') {
        return;
    }

    //过滤空行和两端空格
    doc = doc.split('\n');
    var lines = [];
    for (var i = 0; i < doc.length; i++) {
        var line = doc[i].trim();
        if (line !== '') {
            lines.push(line);
        }
    }

    //检查行数
    if (document.getElementById('check-num').checked) {
        var matches = template.match(/{line\d+}/g);
        if(matches === null) {
            alert('模板代码中不包含{line\\d+}，如: {line1} {line2}');
            return;
        }
        if (lines.length !== matches.length) {
            alert('行数不匹配');
            return;
        }
    }

    for (i = 0; i < lines.length; i++) {
        template = template.replace('{line' + (i + 1) + '}', lines[i]);
    }
    document.getElementById('result').value = template;
}

function clearData () {
    document.getElementById('doc').value = '';
    document.getElementById('result').value = '';
}