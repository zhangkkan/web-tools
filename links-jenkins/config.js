window.JENKINS_CONFIG = {};

JENKINS_CONFIG.vivosun = {
    remark: 'Vivosun',
    version: true,
    stack: false,
    envs: {
        test: {
            job: 'test-sino-web-pc',
            sites: {
                go: { domain: 't.next.vivosun.com' }
            },
        },
        pre: {
            job: 'pre-sino-web',
            sites: {
                go: { domain: 'pre.next.vivosun.com' }
            }
        },
        prod: {
            job: 'prod-sino-web',
            sites: {
                go: { domain: 'vivosun.com' }
            }
        },
    }
};

JENKINS_CONFIG.flexstar = {
    remark: 'Flexstar',
    version: true,
    stack: false,
    envs: {
        test: {
            job: 'test-sino-flexstar',
            sites: {
                go: { domain: 'flexstar-t.sino-beta.com' }
            },
        },
        pre: {
            job: 'pre-flexstar-web',
            sites: {
                go: { domain: 'pre.flex-star.com' }
            }
        },
        prod: {
            job: 'prod-flexstar-web',
            sites: {
                go: { domain: 'flex-star.com' }
            }
        },
    }
};