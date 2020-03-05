const { Builder, By, Key, until } = require("selenium-webdriver");

const CourseReporter = require("./reporter");

class Api {
  constructor(config) {
    this.config = config;
  }

  async activate() {
    try {
      await this._generateDriver();
      this.reporter = new CourseReporter(this.config.username, this.config.passwords.blue, this.config.reports);
      await this.login(this.config.username, this.config.passwords.gold);
      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject();
    }
  }

  async login(username, password) {
    try {
      this.driver.get(this.config.urls.login);
      let form = await this.driver.findElement(By.className("login"));
      await form.findElement(By.id("username")).sendKeys(username);
      await form.findElement(By.id("password")).sendKeys(password);
      await form.findElement(By.name("_eventId_proceed")).click();

      let currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.startsWith("https://login.ucsc.edu/")) {
        await this.completeTfa();
      }
      let continueButton = await this.driver.wait(
        until.elementLocated(By.xpath('//*[@id="shibSubmit"]')),
        30000
      ); // waits 30 seconds for duo approval
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
      await this.driver
        .switchTo()
        .frame(this.driver.findElement(By.id("duo_iframe")));
      let authMethods = await this.driver.wait(
        until.elementLocated(By.xpath('//*[@id="auth_methods"]')),
        1000
      );
      let method = await authMethods.findElement(
        By.className(`row-label ${tfaMethod}-label`)
      );
      let button = await method.findElement(
        By.className("positive auth-button")
      );
      await button.click();
      await this._shiftToMainFrame();
      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject();
    }
  }

  async redirectToEnrollment() {
    try {
      let enrollmentButton = await this.driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Enrollment')]")),
        10000
      );
      await enrollmentButton.click();
    } catch (e) {
      console.log(e);
    }
  }

  async redirectToClassSearch() {
    try {
      let classSearchButton = await this.driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Class Search')]")),
        10000
      );
      await classSearchButton.click();
    } catch (e) {
      console.log(e);
    }
  }

  async checkCoursesStatuses(courses = []) {
    const openCourses = await this._checkStatusUtil(courses, "Open", "open");
    openCourses.forEach(course => {
      this.reporter.updateCourseStatus(course);
      this.reporter.notifyCourseStatus(course, course.spots, "open");
    });
  }

  async _checkStatusUtil(courses, selectTitle, statusKey) {
    try {
      let validatedCourses = [];
      // use for loop due to async await not working well with forEach and map
      for (let i = 0; i < courses.length; i++) {
        await this._shiftToIFrame("ps_target-iframe");

        let regStatusSelect = await this.driver.wait(
          until.elementLocated(By.id("reg_status")),
          10000
        );
        let selection = await regStatusSelect.findElement(
          By.xpath(`//*[contains(text(), '${selectTitle} Classes')]`)
        );
        await selection.click();
        await this.driver
          .findElement(By.id("title"))
          .sendKeys(courses[i].name, Key.ENTER);
        try {
          const courseId = `class_id_${courses[i].id}`;
          await this.driver.findElement(By.id(courseId));
          const enrollmentText = await this.driver.findElement(
            By.xpath("//*[contains(text(), 'Enrolled')]")
          );
          let enrollmentNumbers = await enrollmentText.getText();
          enrollmentNumbers = enrollmentNumbers.match(/\d+/g).map(Number);
          validatedCourses.push({
            ...courses[i],
            [statusKey]: true,
            spots: enrollmentNumbers[1] - enrollmentNumbers[0]
          });
        } catch (e) {
          validatedCourses.push({
            ...courses[i],
            [statusKey]: false,
            spots: 0
          });
        } // Class Not Found

        await this._shiftToMainFrame();
        await this.redirectToClassSearch();
      }
      return Promise.resolve(validatedCourses);
    } catch (e) {
      console.log(e);
      return Promise.reject();
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

  async _shiftToIFrame(frame) {
    await this.driver.wait(until.elementLocated(By.className(frame)), 10000);
    return this.driver
      .switchTo()
      .frame(this.driver.findElement(By.className(frame)));
  }
}

module.exports = Api;
