const Api = require("./assets/ucsc/api");
const courses = require("./courses.json");

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
