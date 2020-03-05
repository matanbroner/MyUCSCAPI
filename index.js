const Api = require("./src/ucsc/api");
const courses = require("./src/assets/courses.json");

const systemConfigs = require('./src/config/system.json');
const userConfigs = require('./src/config/config.json');

const config = {
  ...systemConfigs,
  ...userConfigs
}

const api = new Api(config);

const main = async () => {
  try {
    await api.activate();
    await api.redirectToEnrollment();
    await api.redirectToClassSearch();
    setInterval(() => api.checkCoursesStatuses(courses), 15000);
  } catch (e) {
    console.log(e);
  }
};

main();
