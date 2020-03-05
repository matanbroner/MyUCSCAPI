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
            }
          ]);
          currentCourses.push(newCourse);
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