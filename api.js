const {
    Builder,
    By,
    Key,
    until
} = require('selenium-webdriver');



class Api {
    constructor(config) {
        this.config = config;
    }

    async activate() {
        try {
            await this._generateDriver();
            await this.login(this.config.username, this.config.password);
            return Promise.resolve();
        } catch (e) {
            console.log(e);
            return Promise.reject();
        }
    }

    async login(username, password) {
        try {
            this.driver.get(this.config.urls.login);
            let form = await this.driver.findElement(By.className('login'));
            await form.findElement(By.id('username')).sendKeys(username);
            await form.findElement(By.id('password')).sendKeys(password);
            await form.findElement(By.name('_eventId_proceed')).click();

            let currentUrl = await this.driver.getCurrentUrl();
            if (currentUrl.startsWith('https://login.ucsc.edu/')) {
                await this.completeTfa();
            }
            let continueButton = await this.driver.wait(until.elementLocated(By.xpath('//*[@id="shibSubmit"]')), 30000); // waits 30 seconds for duo approval
            await continueButton.click();
            return Promise.resolve();
        } catch (e) {
            console.log(e);
            return Promise.reject();
        }
    }

    async completeTfa() {
        try {
            const tfaMethod = this.config.tfaMethod;
            this.driver.switchTo().frame(this.driver.findElement(By.id('duo_iframe')));
            let authMethods = await this.driver.wait(until.elementLocated(By.xpath('//*[@id="auth_methods"]')), 1000);
            let method = await authMethods.findElement(By.className(`row-label ${tfaMethod}-label`));
            let button = await method.findElement(By.className('positive auth-button'));
            await button.click();
            await this._shiftToMainFrame();
            return Promise.resolve();
        } catch (e) {
            console.log(e);
            return Promise.reject();
        }
    }

    async redirectToClassSearch(){
        try {
            let enrollmentButton = await this.driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Enrollment')]")), 10000);
            await enrollmentButton.click();
            let classSearchButton = await this.driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Class Search')]")), 10000);
            await classSearchButton.click();
        } catch (e) {
            console.log(e);
        }
    }

    async _generateDriver() {
        try {
            this.driver = await new Builder().forBrowser(this.config.browser).build();
            return Promise.resolve();
        } catch (e) {
            console.log(e);
            return Promise.reject();
        }
    }

    async _shiftToMainFrame() {
        try {
            let parentWindow = await this.driver.getWindowHandle();
            await this.driver.switchTo().parentFrame(parentWindow);
            return Promise.resolve();
        } catch (e) {
            console.log(e);
            return Promise.reject();
        }
    }
}

module.exports = Api