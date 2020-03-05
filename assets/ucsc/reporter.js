const TextMessager = require("../messager");

class CourseReporter {
  constructor(config) {
    this.config = config;
    this._generateMessager();

    this.courses = {};
  }

  updateCourseStatus(course) {
    let notify = true;
    if (Object.keys(this.courses).length !== 0) {
      notify =
        (course.spots > 0 && this.courses[course.id].spots == 0) ||
        (course.spots == 0 && this.courses[course.id].spots > 0);
    }
    this.courses[course.id] = {
      ...course,
      notify
    };
  }

  _generateMessager() {
    this.messager = new TextMessager({
      username: this.config.username,
      password: this.config.password,
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
