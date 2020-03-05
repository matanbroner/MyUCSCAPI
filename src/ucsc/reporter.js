const TextMessager = require("../messager");

class CourseReporter {
  constructor(username, password, config) {
    this.config = config;
    this._generateMessager(username, password);

    this.courses = {};
  }

  updateCourseStatus(course) {
    let notify = true;
    if (!(course.id in this.courses) || this.courses === {}) {
      notify = course.spots > 0;
    } else {
      notify =
        (course.spots > 0 && this.courses[course.id].spots === 0) ||
        (course.spots === 0 && this.courses[course.id].spots > 0);
    }
    this.courses[course.id] = {
      ...course,
      notify
    };
  }

  _generateMessager(username, password) {
    this.messager = new TextMessager({
      username,
      password,
      provider: this.config.provider
    });
  }

  notifyCourseStatus(course, openSpots, status) {
    if (this.courses[course.id].notify) {
      const message = `Course \'${course.name}\' has ${openSpots} ${status} spots available!`;
      this.messager.sendTextMessage(this.config.phone, course.name, message);
    }
  }
}

module.exports = CourseReporter;
