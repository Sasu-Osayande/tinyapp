const getUsersByEmail = (email, database) => {
  const userKeys = Object.keys(database);
  for (const user of userKeys) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

function generateRandomString(length) {
  let randomString = "";
  let characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i <= length - 1; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
};

module.exports = { getUsersByEmail, generateRandomString };