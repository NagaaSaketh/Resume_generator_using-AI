const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailId } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name is not valid!");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Please enter valid email address!");
  }
};

module.exports = { validateSignUpData };
