const { assert } = require('chai');

const { getUsersByEmail } = require('../helper.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUsersByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUsersByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.deepEqual(user.id, expectedUserID);
  });
  it('should return undefined if user is not in database', function() {
    const user = getUsersByEmail("user3@example.com", testUsers)
    const expectedUserID = undefined;
    assert.deepEqual(user, expectedUserID);
  });
});