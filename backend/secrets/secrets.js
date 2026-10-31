require("dotenv").config();

const authKey =
  process.env.JWT_SECRET ||
  process.env.AUTH_KEY ||
  'J;u7KZ~2EkNz:=8tsx]P9n,@c4mXTR:F1g:HPKv%vkb;CFZ2M+Zl*;NdL8A?"+.';

const emailHost = process.env.EMAIL_HOST || "mail.jbstranspune.com";
const emailPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
const emailUser = process.env.EMAIL_USER || "support@jbstranspune.com";
const emailPass = process.env.EMAIL_PASS || "Support@2024#";

module.exports = {
  authKey,
  emailHost,
  emailPort,
  emailUser,
  emailPass,
};
