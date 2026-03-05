var app = new Vue({
    el: '#app',
    data: {
        origins: [''],
        rule: '{col1}',
        separator: '\\n',
        result: ''
    },
    mounted: function () {
        require('api-clipboard').set('btn-copy', 'result');
    },
    computed: {
        originStyle: function () {
            return {
                width: (100 / Math.min(this.origins.length, 3)) + '%'
            };
        }
    },
    methods: {
        addOrigin: function () {
            this.origins.push('');
        },
        removeOrigin: function (idx) {
            this.origins.splice(idx, 1);
        },
        splitByComma: function (idx) {
            this.$set(this.origins, idx, this.origins[idx].replace(/,/g, '\n'));
        },
        strToArr: function (str) {
            var arr = str.trim().split('\n');
            for (var i = 0; i < arr.length; i ++) {
                var t = arr[i].trim();
                if (t === '') {
                    arr.splice(i, 1);
                    i --;
                } else {
                    arr[i] = t;
                }

            }
            return arr;
        },
        transCase: function (col, str) {
            if (col.indexOf('|upper') !== - 1) {
                str = str.toUpperCase();
            } else if (col.indexOf('|lower') !== - 1) {
                str = str.toLowerCase();
            } else if (col.indexOf('|title') !== - 1) {
                str = str.replace(/(^|\s+)\w/g, function (s) {
                    return s.toUpperCase();
                });
            }
            return str;
        },
        spliceAsRule: function () {
            //计算行数
            var firstOriginArr = this.strToArr(this.origins[0]);
            var rowsLen = firstOriginArr.length;
            if (rowsLen === 0) {
                alert('第一个字段不能为空');
                this.$refs.origin[0].focus();
                return false;
            }
            //origins子元素转数组
            var originsArr = [firstOriginArr];
            for (var i = 1; i < this.origins.length; i ++) {
                var arr = this.strToArr(this.origins[i]);
                if (arr.length !== rowsLen) {
                    alert('第 ' + (i + 1) + ' 个字段行数跟第一个字段行数不一致');
                    return false;
                } else {
                    originsArr.push(arr);
                }
            }

            //规则解析
            var rule = this.rule.trim();
            if (rule === '') {
                alert('拼接规则不能为空');
                this.$refs.rule.focus();
                return false;
            }

            //拼接
            var lines = [];
            var cols = rule.match(/{col\d+.*?}/g);
            for (var rowIdx = 0; rowIdx < rowsLen; rowIdx ++) {
                var line = rule;
                for (var i = 0; i < cols.length; i ++) {
                    var col = cols[i];
                    var colIdx = parseInt(/\d+/.exec(col));
                    if (isNaN(colIdx) || colIdx > originsArr.length) {
                        alert('拼接规则错误，请检查关键字：' + col);
                        return false;
                    }
                    var str = this.transCase(col, originsArr[colIdx - 1][rowIdx]);
                    line = line.replace(col, str);
                    line = line.replace(/\{index\}/g, rowIdx).replace(/\{index\+1\}/g, (rowIdx + 1));
                }
                lines.push(line);
            }
            //赋值
            var separator = this.separator.trim().replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            var elemResult = this.$refs.result;
            elemResult.value = lines.join(separator);
            window.scrollTo(0, elemResult.offsetTop);
        }
    }
});


