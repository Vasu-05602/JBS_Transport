const jwt = require("jsonwebtoken");
const secrets = require("../secrets/secrets");
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    const decodedToken = jwt.verify(token, secrets.authKey);
    // const isExpired = !(Date.now() >= decodedToken.exp * 1000);
    // if (isExpired) {
    //   res.status(200).json({ message: 'Authentication token is expired. Please logout and login again and try.' });
    // } else {
    //   req.userData = {
    //     email: decodedToken.email,
    //     userId: decodedToken.userId
    //   };
    //   next();
    // }

    req.userData = {
      username: decodedToken.username,
      userId: decodedToken.userId,
      type: decodedToken.type,
    };
    next();
  } catch (error) {
    res.status(200).json({
      message:
        "Authentication failed. Please try after relogging or contact the administrator.",
    });
  }
};
