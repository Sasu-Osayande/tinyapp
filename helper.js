const getUsersByEmail = (email, database) => {
  const userKeys = Object.keys(database);
  for (const user of userKeys) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = { getUsersByEmail };