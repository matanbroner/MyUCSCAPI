const Api = require('./api');

const config = {
    username: 'mbroner',
    password: 'ma97ro99ra14',
    browser: 'chrome',
    tfaMethod: 'push', // push, passcode, or phone
    urls: {
        login: 'https://my.ucsc.edu/'
    }
}

const api = new Api(config);

try {
     api.activate()
        .then(() => api.redirectToClassSearch())
} catch (e) {
    console.log(e);
}