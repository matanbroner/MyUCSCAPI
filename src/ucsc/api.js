const { Builder, By, Key, until } = require("selenium-webdriver");

const utils = require("../assets/utils");
const apiAssets = require("../assets/api");

class Api {
  constructor(config, reporter) {
    this.config = config;
    this.reporter = reporter;
  }

  async activate() {
    try {
      await this._generateDriver();
      await this.login(this.config.username, this.config.passwords.gold);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject();
    }
  }

  waitTime() {
    return this.config.webdriver.wait;
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
        this.waitTime()
      );
      await continueButton.click();
      return Promise.resolve();
    } catch (e) {
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
        this.waitTime()
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
      return Promise.reject();
    }
  }

  async redirectToEnrollment() {
    try {
      let enrollmentButton = await this.driver.wait(
        until.elementLocated(By.xpath("//*[contains(text(), 'Enrollment')]")),
        this.waitTime()
      );
      await enrollmentButton.click();
    } catch (e) {}
  }

  async redirectTab(tab) {
    try {
      await utils.retry(
        async function() {
          this._shiftToMainFrame();
          let classSearchButton = await this.driver.wait(
            until.elementLocated(By.xpath(`//*[contains(text(), '${tab}')]`)),
            this.waitTime()
          );
          await classSearchButton.click();
        }.bind(this)
      );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject();
    }
  }

  async addToCart(course) {
    try {
      await utils.retry(
        async function() {
          let shoppingCartWrapper = await this.driver.findElement(
            By.id(`cartForm${course.id}`)
          );
          let addToCart = await shoppingCartWrapper.findElement(By.css("a"));
          await addToCart.click();
        }.bind(this)
      );
      if (await this._isAlreadyInShoppingCart()) {
        return;
      }
      if (course.labSectionId) {
        let labSectionTable = await this.driver.wait(
          until.elementLocated(By.xpath(apiAssets.xpaths.labSectionTable)),
          this.waitTime()
        );
        let labSectionInput = await this._findSectionRow(
          labSectionTable,
          course.labSectionId
        );
        await labSectionInput.click();
      }
      if (course.discussionSectionId) {
        let discussionSectionTable = await this.driver.wait(
          until.elementLocated(
            By.xpath(apiAssets.xpaths.discussionSectionTable)
          ),
          this.waitTime()
        );
        let discussionSectionInput = await this._findSectionRow(
          discussionSectionTable,
          course.discussionSectionId
        );
        await discussionSectionInput.click();
      }
      let submitSectionsButton = await this.driver.findElement(
        By.name("DERIVED_CLS_DTL_NEXT_PB")
      );
      await submitSectionsButton.click();

      if (course.config.autoWaitlist) {
        let wailistCheckbox = await this.driver.wait(
          until.elementLocated(By.name("DERIVED_CLS_DTL_WAIT_LIST_OKAY$125$")),
          this.waitTime()
        );
        await wailistCheckbox.click();
      }

      let submitSettingsButton = await this.driver.wait(
        until.elementLocated(By.name("DERIVED_CLS_DTL_NEXT_PB$280$")),
        this.waitTime()
      );
      await submitSettingsButton.click();
    } catch (e) {}
    return Promise.resolve();
  }

  async enroll(course) {
    try {
      await this.redirectTab(apiAssets.tabs.shoppingCart);
      await this._shiftToIFrame("ps_target-iframe");
      let shoppingCartTable = await this.driver.wait(
        until.elementLocated(By.xpath(apiAssets.xpaths.shoppingCartTable)),
        this.waitTime()
      );
      let courseCheckbox = await this._findEnrollmentCartRow(
        shoppingCartTable,
        course.id
      );
      await courseCheckbox.click();
      let enrollButton = await this.driver.findElement(
        By.name("DERIVED_REGFRM1_LINK_ADD_ENRL$291$")
      );
      await enrollButton.click();
      let finishEnrollingButton = await this.driver.wait(
        until.elementLocated(By.name("DERIVED_REGFRM1_SSR_PB_SUBMIT")),
        this.waitTime()
      );
      await finishEnrollingButton.click();
      let enrollmentStatusTable = await this.driver.wait(
        until.elementLocated(By.xpath(apiAssets.xpaths.enrollmentStatusTable)),
        this.waitTime()
      );
      return this._verifyEnrollmentStatus(enrollmentStatusTable);
    } catch (e) {}
  }

  async getOpenSpots() {
    try {
      const enrollmentText = await this.driver.findElement(
        By.xpath("//*[contains(text(), 'Enrolled')]")
      );
      let enrollmentNumbers = await enrollmentText.getText();
      enrollmentNumbers = enrollmentNumbers.match(/\d+/g).map(Number);
      const spots = enrollmentNumbers[1] - enrollmentNumbers[0];
      return Promise.resolve(spots);
    } catch (e) {
      return Promise.reject();
    }
  }

  async checkCoursesStatuses(courses) {
    // use for loop due to async await not working well with forEach and map
    for (let i = 0; i < courses.length; i++) {
      await this._shiftToMainFrame();
      await this.redirectTab(apiAssets.tabs.classSearch);
      if (courses[i].active) {
        let courseStatus = await this._checkOpenStatusUtil(
          courses[i],
          "Open",
          "open"
        );
        let updatedCourse = courseStatus[0];
        let enrolled = courseStatus[1];
        this.reporter.updateCourseStatus(updatedCourse);
        this.reporter.notifyCourseStatus(
          updatedCourse,
          updatedCourse.spots,
          "open"
        );
        if (!updatedCourse.active|| enrolled[1]) {
          this.reporter.notifyEnrollment(courses[i], enrolled[0], enrolled[1]);
        }
      }
    }
  }

  async _checkOpenStatusUtil(course, selectTitle, statusKey) {
    let enrolled = [];
    let validatedCourse = {};
    try {
      await utils.retry(
        async function() {
          await this._shiftToIFrame("ps_target-iframe");
          let regStatusSelect = await this.driver.wait(
            until.elementLocated(By.id("reg_status")),
            this.waitTime()
          );
          let selection = await regStatusSelect.findElement(
            By.xpath(`//*[contains(text(), '${selectTitle} Classes')]`)
          );
          await selection.click();
        }.bind(this)
      );
      await this.driver
        .findElement(By.id("title"))
        .sendKeys(course.name, Key.ENTER);
      try {
        const courseIdTag = `class_id_${course.id}`;
        await this.driver.findElement(By.id(courseIdTag));
        const spots = await this.getOpenSpots();
        if (spots > 0 && course.config.autoEnroll) {
          await this.addToCart(course);
          enrolled = await this.enroll(course);
          if (enrolled[0]) {
            course.active = false;
          }
        }
        validatedCourse = {
          ...course,
          [statusKey]: true,
          spots
        };
      } catch (e) {
        // Class Not Found
        validatedCourse = {
          ...course,
          [statusKey]: false,
          spots: 0
        };
      }
      return Promise.resolve([validatedCourse, enrolled]);
    } catch (e) {
      return Promise.reject();
    }
  }

  async _findSectionRow(table, sectionId) {
    let statuses = {};
    let tableRows = await this._fetchTableRows(table);
    for (let i = 0; i < tableRows.length; i++) {
      try {
        let row = tableRows[i];
        let cells = await row.findElements(
          By.className(
            i % 2 == 0 ? "PSLEVEL1GRIDEVENROW" : "PSLEVEL1GRIDODDROW"
          )
        );
        let id = await cells[1].findElement(By.className("PSEDITBOX_DISPONLY"));
        id = await id.getText();
        let imageStatus = await cells[6].findElement(By.css("img"));
        imageStatus = await imageStatus.getAttribute("src");
        statuses[id] = {
          selectInput: cells[0],
          open: imageStatus.includes("STATUS_OPEN")
        };
      } catch (e) {
        continue;
      }
    }
    if (sectionId in statuses && statuses[sectionId].open) {
      return Promise.resolve(statuses[sectionId].selectInput);
    } else {
      return Promise.reject(null);
    }
  }

  async _findEnrollmentCartRow(table, courseId) {
    let tableRows = await this._fetchTableRows(table);
    let courseCheckbox = null;
    while (!courseCheckbox) {
      for (let i = 0; i < tableRows.length; i++) {
        try {
          let row = tableRows[i];
          let cells = await row.findElements(
            By.className(
              i % 2 == 0 ? "PSLEVEL1GRIDEVENROW" : "PSLEVEL1GRIDODDROW"
            )
          );
          let courseName = await cells[1].findElement(By.css("a"));
          courseName = await courseName.getText();
          if (courseName.includes(courseId)) {
            return cells[0].findElement(By.className("PSCHECKBOX"));
          }
        } catch (e) {
          continue;
        }
      }
    }
  }

  async _parseTableFunction(table, func) {
    let tableRows = await this._fetchTableRows(table);
    for (let i = 0; i < tableRows.length; i++) {
      try {
        let row = tableRows[i];
        let cells = await row.findElements(
          By.className(
            i % 2 == 0 ? "PSLEVEL1GRIDEVENROW" : "PSLEVEL1GRIDODDROW"
          )
        );
        return func(cells);
      } catch (e) {
        continue;
      }
    }
  }

  async _verifyEnrollmentStatus(table) {
    let tableRows = await this._fetchTableRows(table);
    for (let i = 0; i < tableRows.length; i++) {
      try {
        let row = tableRows[i];
        let cells = await row.findElements(
          By.className(
            i % 2 == 0 ? "PSLEVEL1GRIDEVENROW" : "PSLEVEL1GRIDODDROW"
          )
        );
        let statusImage = await cells[2].findElement(By.css("img"));
        let statusImageSrc = await statusImage.getAttribute("src");
        if (!statusImageSrc.includes("STATUS_ERROR")) {
          return [true, null];
        } else {
          let errorMessage = await (
            await cells[1].findElement(By.css("div"))
          ).findElement(By.css("div"));
          return [false, await errorMessage.getText()];
        }
      } catch (e) {
        continue;
      }
    }
  }

  async _isAlreadyInShoppingCart() {
    try {
      await this.driver.findElement(
        By.xpath(
          `//*[contains(text(), 'This class is already in your Shopping Cart')]`
        )
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  async _fetchTableRows(table) {
    let tableRows = [];
    await utils.retry(
      async function() {
        tableRows = await table.findElements(By.css("tr"));
      }.bind(this)
    );
    return Promise.resolve(tableRows);
  }

  async _generateDriver() {
    try {
      this.driver = await new Builder().forBrowser(this.config.browser).build();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject();
    }
  }

  async _shiftToMainFrame() {
    try {
      let parentWindow = await this.driver.getWindowHandle();
      await this.driver.switchTo().parentFrame(parentWindow);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject();
    }
  }

  async _shiftToIFrame(frame) {
    await this.driver.wait(
      until.elementLocated(By.className(frame)),
      this.waitTime()
    );
    return this.driver
      .switchTo()
      .frame(this.driver.findElement(By.className(frame)));
  }
}

module.exports = Api;
