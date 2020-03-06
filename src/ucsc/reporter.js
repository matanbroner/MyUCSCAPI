const TextMessager = require("../messager");
const fs = require('fs');


class CourseReporter {
  constructor(username, password, config) {
    this.config = config;
    this._generateMessager(username, password);

    this.courses = {};
  }

  getCourses(){
    return Object.values(this.courses);
  }

  initializeCourses(courses){
    courses.forEach((course) => this.updateCourseStatus({
      ...course,
      spots: 0
    }))
  }

  updateCourseStatus(course) {
    let notify = true;
    if (!(course.id in this.courses) || this.courses === {}) {
      notify = course.spots > 0;
    } else {
      notify = (course.spots > 0 && this.courses[course.id].spots === 0) || (course.spots === 0 && this.courses[course.id].spots > 0);
    }
    this.courses[course.id] = {
      ...course,
      notify
    };
  }

  updateCoursesFile(){
    strCourses = JSON.stringify(this.courses);
    fs.writeFileSync('src/assets/courses.json', strCourses);
    this.courses = fs.readFileSync('src/assets/courses.json');
  }

  _generateMessager(username, password) {
    this.messager = new TextMessager({
      username,
      password,
      provider: this.config.provider
    });
  }

  sendMessage(course, message){
    console.log(message)
    this.messager.sendTextMessage(this.config.phone, course.name, message);
  }

  notifyCourseStatus(course, openSpots, status, send=true) {
    if (this.courses[course.id].notify && this.courses[course.id].config.notifyOpenSpots) {
      const message = `Course \'${course.name}\' has ${openSpots} ${status} spots available.`;
      if(send){
        this.sendMessage(course, message);
      }
      return message;
    }
  }

  notifyEnrollment(course, status, error=null, send=true){
    const message = status
    ?`Succesfully enrolled you in course '${course}'!`
    : `Error encountered enrolling you in course '${course.name}' -- ${error}`
    if(send){
      this.sendMessage(course, message);
    }
    return message;
  }
}

module.exports = CourseReporter;
