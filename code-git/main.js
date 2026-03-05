const TODAY = new Date().toISOString().replace(/T.*/, '').replace(/-/g, '')

var app = new Vue({
    el: '#app',
    data: {
        merge2From: '',
        merge2Target: 'test',
        merge2deleteLocal: false,
        merge2ReleaseBranch: false,
        releaseBranch: 'release/' + TODAY,
        createBranchName: '',
        createBranchType: 'Feature',
        reveiwBranch: '',
    },
    mounted: function () {
        var clipboard = require('api-clipboard')
        clipboard.batchSet('.btn', {
            target: function (trigger) {
                return trigger.previousElementSibling;
            }
        });

        this.createBranchName = localStorage.getItem('createBranchName') || 'feature/yywang/';
    },
    computed: {
        reveiwCode: function () {
            var branch = this.reveiwBranch
            if (branch === '') {
                return ''
            }
            branch = branch.replace('origin/', '')
            var arr = [
                'git fetch --prune origin',
                'git checkout -b {branch} origin/{branch}',
                'git checkout develop',
                'git pull origin develop',
                'git merge --squash {branch}'
            ]
            return arr.join('\n').replace(/\{branch\}/g, branch) + '\n'
        },
        releaseCode: function () {
            var branch = this.releaseBranch
            if (branch === '') {
                return ''
            }
            branch = branch.replace('origin/', '').replace('release/', '')
            var arr = [
                'git fetch --prune origin',
                'git checkout develop',
                'git pull origin develop',
                'git merge release/{branch}',
                'git push origin develop',
                'git checkout master',
                'git pull origin master',
                'git merge release/{branch}',
                'git push origin master',
                'git branch -d release/{branch}',
                'git tag {branch}',
                'git push origin {branch}'
            ]
            return arr.join('\n').replace(/\{branch\}/g, branch) + '\n'
        },
        merge2Code: function () {
            var from = this.merge2From.replace('origin/', '')
            var target = this.merge2Target.replace('origin/', '')
            if (from === '' || target === '') {
                return ''
            }
            var arr;
            if (this.merge2deleteLocal) {
                arr = [
                    'git fetch --prune origin',
                    'git branch -D {from}',
                    'git checkout -b {from} origin/{from}',
                    'git checkout {target}',
                    'git pull origin {target}',
                    'git merge {from}',
                    'git push origin {target}',
                    'git branch -D {from}',
                ]
            } else {
                arr = [
                    'git fetch --prune origin',
                    'git checkout -b {from} origin/{from}',
                    'git checkout {from}',
                    'git pull origin {from}',
                    'git checkout -b {target} origin/{target}',
                    'git checkout {target}',
                    'git pull origin {target}',
                    'git merge {from}',
                    'git push origin {target}'
                ]
            }
            return arr.join('\n').replace(/\{from\}/g, from).replace(/\{target\}/g, target) + '\n'
        },
        createBranchCode: function () {
            var branch = this.createBranchName;
            if (branch === '') {
                return ''
            }
            var arr = [
                'git fetch --prune origin',
                'git checkout develop',
                'git pull origin develop',
                'git checkout -b {branch}',
            ]
            return arr.join('\n').replace(/\{branch\}/g, branch) + '\n'
        },
    },
    methods: {
        recordFeaturePrefix: function () {
            var matched = this.createBranchName.match(/^feature\/(\w+)\//);
            if (matched) {
                localStorage.setItem('createBranchName', matched[0])
            }
        }
    },
    watch: {
        merge2ReleaseBranch: function (val) {
            this.merge2Target = val ? 'release/' + TODAY : 'test';
        },
        createBranchType: function (val) {
            switch (val) {
                case 'Feature':
                    this.createBranchName = localStorage.getItem('createBranchName') || 'feature/yywang/';
                    break;
                case 'Release':
                    this.createBranchName = 'release/' + TODAY;
                    break;
                case 'Hotfix':
                    this.createBranchName = 'hotfix/' + TODAY + '-';
                    break;
            }
        }
    }
});


