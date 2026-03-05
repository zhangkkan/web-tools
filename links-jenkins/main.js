let domUtils = require('dom-utils');

new Vue({
    el: '#app',
    data: {
        config: JENKINS_CONFIG,
        filterProject: '',
        filterKey: '',
        jenkinsRoot: 'http://jenkins.sino-beta.com:8080/',
    },
    computed: {
        // 根据筛选条件得出的新的config对象
        filtratedConfig() {
            const { filterProject, filterKey } = this
            if (filterProject === '') {
                return this.config
            }
            let project = domUtils.extend({}, this.config[filterProject])
            if (filterKey !== '') {
                let envs = project.envs
                let newEnvs = {}
                const reg = new RegExp(project.filters[filterKey])
                for (let envName in envs) {
                    if (reg.test(envName)) {
                        newEnvs[envName] = envs[envName]
                    }
                }
                project.envs = newEnvs
            }
            let newConfig = {}
            newConfig[filterProject] = project
            return newConfig
        }
    },
    methods: {
        filtrate(projectName, filterKey) {
            this.filterProject = projectName
            this.filterKey = filterKey || ''
        },
        getDeployLink(job, envKey) {
            const fillBranchAffix = envKey !== 'prod' ? 'build?delay=0sec' : '';
            return this.jenkinsRoot + 'job/' + job + '/' + fillBranchAffix;
        },
        getSiteLink(domain) {
            return 'https://' + domain
        },
        getVersionLink(domain) {
            return 'https://' + domain + '/gitversion' + '?v=' + Math.round(Math.random() * 1000000)
        },
    }
})
