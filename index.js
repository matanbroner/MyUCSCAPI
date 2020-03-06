const Api = require("./src/ucsc/api");
const CourseReporter = require('./src/ucsc/reporter');
const courses = require("./src/assets/courses.json");

const systemConfigs = require('./src/config/system.json');
const userConfigs = require('./src/config/config.json');

const config = {
  ...systemConfigs,
  ...userConfigs
}

const reporter = new CourseReporter(config.username, config.passwords.blue, config.reports);
reporter.initializeCourses(courses);
const api = new Api(config, reporter);

const main = async () => {
  try {
    await api.activate();
    await api.redirectToEnrollment();
    api.checkCoursesStatuses(reporter.getCourses())
    setInterval(() => {
      console.log("%c Performing Courses Status Checks", "color: blue");
      api.checkCoursesStatuses(reporter.getCourses());
    }, config.timer * 1000 * 60);
  } catch (e) {
    console.log(e);
  }
};

main();
