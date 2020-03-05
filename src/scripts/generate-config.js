const inquirer = require("inquirer");
const fs = require('fs');

inquirer
  .prompt([
    {
      type: "input",
      name: "username",
      message: "MyUCSC Username:"
    },
    {
      type: "password",
      name: "passwords.gold",
      message: "MyUCSC Gold Password:"
    },
    {
      type: "password",
      name: "passwords.blue",
      message: "MyUCSC Blue Password:"
    },
    {
      type: "list",
      message: "Select Browser",
      name: "browser",
      choices: [
        {
          name: "Chrome",
          value: "chrome"
        },
        {
          name: "Firefox",
          value: "firefox"
        }
      ]
    },
    {
      type: "list",
      message: "Select Duo Authentication Method",
      name: "tfaMethod",
      choices: [
        {
          name: "Push Notification",
          value: "push"
        },
        {
          name: "Call Me",
          value: "phone"
        },
        {
          name: "Enter a Passcode",
          value: "passcode"
        }
      ]
    },
    {
      type: "list",
      message: "Select Cellphone Provider",
      name: "reports.provider",
      choices: [
        {
          name: "AT&T",
          value: "att"
        },
        {
          name: "T-Mobile",
          value: "tmobile"
        },
        {
          name: "Verizon",
          value: "verizon"
        },
        {
          name: "Cricket Wireless",
          value: "cricket"
        },
        {
          name: "US Cellular",
          value: "uscellular"
        }
      ]
    },
    {
      type: "input",
      name: "reports.phone",
      message: "Phone Number (No symbols or +1 - ex. 1234567890):",
      validate: function(value) {
        let pass = /^\d+$/.test(value) && value.length == 10;
        if (pass) {
          return true;
        }

        return "Please enter a valid phone number.";
      }
    }
  ])
  .then(answers => {
    strAnswers = JSON.stringify(answers);
    fs.writeFileSync('src/config/config.json', strAnswers);
  });
