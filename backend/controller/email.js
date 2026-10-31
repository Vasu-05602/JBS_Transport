const nodemailer = require("nodemailer");
const {
  emailHost,
  emailPort,
  emailUser,
  emailPass,
} = require("../secrets/secrets");

async function sendEmail(to, base64Content, fileName, subject, text, html) {

  let transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  if (to && base64Content && fileName && subject && text && html) {
    let info = await transporter.sendMail({
      from: '"JBS Support" <support@jbstranspune.com>',
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: [
        {
          filename: fileName,
          content: base64Content,
          encoding: "base64",
        },
      ],
    });
  } else if (to && subject && text && html) {
    let info = await transporter.sendMail({
      from: '"JBS Support" <support@jbstranspune.com>',
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: [],
    });
  } else {
    throw new Error("Parameters are missing!");
  }

  // const fs = require("fs");
  // const contents = fs.readFileSync("bills/bills/000001.pdf", {
  //   encoding: "base64",
  // });

  // let info = await transporter.sendMail({
  //   from: '"JSM Support" <support@jaisantoshimaatransport.com>',
  //   to: "mohsinsha@gmail.com",
  //   subject: "Hello ✔",
  //   text: "Hello world?",
  //   html: "<b>Hello world?</b>",
  //   attachments: [
  //     {
  //       filename: `myfile.pdf`,
  //       content: contents,
  //       encoding: "base64",
  //     },
  //   ],
  // });

  // console.log("Message sent: %s", info.messageId);

  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

// sendEmail()
//   .then((response) => console.log("Email sent"))
//   .catch(console.error);

module.exports = sendEmail;
