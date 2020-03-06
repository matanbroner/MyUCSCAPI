const inquirer = require("inquirer");
const fs = require('fs');
var currentCourses = require('../assets/courses.json');

var addMore = true;

const addCourses = async () => {
    while(addMore){
        newCourse = await inquirer
          .prompt([
            {
              type: "input",
              name: "name",
              message: "Full Course Name:"
            },
            {
              type: "input",
              name: "id",
              message: "Course ID:"
            },
            {
              type: "input",
              name: "discussionSectionId",
              message: "Discussion Section ID (ENTER for none):"
            },
            {
              type: "input",
              name: "labSectionId",
              message: "Lab Section ID (ENTER for none):"
            },
            {
              type: "list",
              message: "Notify on Open Spots?",
              name: "config.notifyOpenSpots",
              choices: [
                {
                  name: "Yes",
                  value: true
                },
                {
                  name: "No",
                  value: false
                }
              ]
            },
            {
              type: "list",
              message: "Auto enroll when open spots found?",
              name: "config.autoEnroll",
              choices: [
                {
                  name: "Yes",
                  value: true
                },
                {
                  name: "No",
                  value: false
                }
              ]
            },
            {
              type: "list",
              message: "Auto waitlist when enrolling?",
              name: "config.autoWaitlist",
              choices: [
                {
                  name: "Yes",
                  value: true
                },
                {
                  name: "No",
                  value: false
                }
              ]
            }
          ]);
          currentCourses.push({
            ...newCourse,
            active: true
          });
          continueAnswers = await inquirer.prompt([
            {
                type: "list",
                message: "Add another course?",
                name: "addMore",
                choices: [
                  {
                    name: "Yes",
                    value: true
                  },
                  {
                    name: "No",
                    value: false
                  }
                ]
              }
          ]);
          addMore = continueAnswers.addMore;
    }
    strCourses = JSON.stringify(currentCourses);
    fs.writeFileSync('src/assets/courses.json', strCourses);
}

addCourses();