const {
    Builder,
    By,
    Key,
    until
} = require('selenium-webdriver');



class Api {
    constructor(config){
        this.config = config;
    }

    async activate(){
        try {
            await this._generateDriver();
            this.login(this.config.username, this.config.password);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async login(username, password){
        this.driver.get(this.config.urls.login);
        let form = await this.driver.findElement(By.className('login'));
        await form.findElement(By.id('username')).sendKeys(username);
        await form.findElement(By.id('password')).sendKeys(password);
        await form.findElement(By.name('_eventId_proceed')).click();

        let currentUrl = await this.driver.getCurrentUrl();
        if(currentUrl.startsWith('https://login.ucsc.edu/')){
            await this.completeTfa();
        }
    }

    async completeTfa(){
        let tfaForm = await this.driver.findElement(By.className('login'));
        let button = await this.driver.wait(until.elementLocated(By.id('/html/body/div/div/div[1]/div/form/div[1]/fieldset/div[1]/button')), 10000);
        await button.click();
    }

    async _generateDriver(){
        try {
            this.driver = await new Builder().forBrowser(this.config.browser).build();
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }
}

module.exports = Api