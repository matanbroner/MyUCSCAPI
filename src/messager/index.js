const nodemailer = require("nodemailer");
const providers = require("../assets/providers.json");

class TextMessager {
  constructor(config) {
    this.config = config;
    this._generateTransporter();
  }

  sendTextMessage(phone, subject, text) {
    const email = `${phone}@${this._fetchProvider()}`;
    const mailOptions = {
      from: `${this.config.username}@ucsc.edu`,
      to: email,
      subject: subject,
      text: text
    };

    this.transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        return Promise.reject(error);
      } else {
        return Promise.resolve(info.response);
      }
    });
  }

  _fetchProvider() {
    const providerEmail = providers[this.config.provider];
    if (typeof providerEmail === "undefined") {
      throw `Provider Invalid: No mailing option present for provider ${this.config.provider}`;
    }

    return providerEmail;
  }

  _generateTransporter() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `${this.config.username}@ucsc.edu`,
        pass: this.config.password
      }
    });
  }
}

module.exports = TextMessager;
