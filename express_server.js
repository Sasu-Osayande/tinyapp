// import from helper functions
const { getUsersByEmail, generateRandomString } = require("./helper");

// middleware
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const morgan = require("morgan");
app.use(morgan("dev"));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require("cookie-session");

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2", "key3", "key4"],
  })
);

const bcrypt = require("bcryptjs");
const password = "123";
const hashedPassword = bcrypt.hashSync(password, 10);

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$azcPh0.o/FSd.vEMVo91ou9zKfzt2UqXBP0ES060111uB9JFhLfuS",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$azcPh0.o/FSd.vEMVo91ou9zKfzt2UqXBP0ES060111uB9JFhLfuS",
  },
};

// returns the urls of the user that is logged in
const urlsForUser = (id) => {
  const urlsObj = {};
  const shortURLS = Object.keys(urlDatabase);
  for (const shortURL of shortURLS) {
    if (id === urlDatabase[shortURL].userID) {
      urlsObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return urlsObj;
};

// checks the user id value and compares it to the database to determine the user, if they exist
const getUserByID = (userID) => {
  const userKeys = Object.keys(users);
  for (const user of userKeys) {
    if (users[user].id === userID) {
      return users[user];
    }
  }
  return undefined;
};

// home page. Will redirect to the login page if user is not logged in
app.get("/", (req, res) => {
  const user = getUserByID(req.session.user_id);
  const templateVars = {
    user,
  };
  if (user) {
    res.redirect("/urls");
    return;
  }
  res.render("urls_login", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// sending data to urls_index
app.get("/urls", (req, res) => {
  const user = getUserByID(req.session.user_id);
  if (!user) {
    return res.status(403).send("Please <a href='/login'>login</a> to access.");
  }
  const templateVars = {
    user,
    urls: urlsForUser(user.id),
  };
  res.render("urls_index", templateVars);
});

// rendering urls_new
app.get("/urls/new", (req, res) => {
  const user = getUserByID(req.session.user_id);
  const templateVars = {
    user: user || null,
  };
  if (templateVars.user == null) {
    return res.redirect(403, "/login");
  }
  res.render("urls_new", templateVars);
});

// redirects to its long URL
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("ID does not exist.");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// rendering urls_show
app.get("/urls/:shortURL", (req, res) => {
  const user = getUserByID(req.session.user_id);
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
  };
  // if the shorl url is invalid, return an error page
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("ID does not exist.");
  }
  // if trying to access without being logged in, redirect to the login page
  if (!templateVars.user) {
    return res.status(403).send("Please <a href='/login'>login</a> to access.");
  }
  longURL = urlDatabase[req.params.shortURL].longURL;
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const user = getUserByID(req.session.user_id);
  const templateVars = {
    user,
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = getUserByID(req.session.user_id);
  const templateVars = {
    user,
  };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;

  // updates database with new URL
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session.user_id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// removes URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// updates a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  const user = getUsersByEmail(req.body.email, users);
  // send an error if trying to login under an unregistered account
    if (!user) {
      res.status(403).send("User cannot be found.");
    }
    if (user) {
      // if registered, determine if email-password combination is correct
      if (!bcrypt.compareSync(password, hashedPassword)) {
        return res.status(403).send("Email or password is incorrect.");
      } else {
        req.session.user_id = user.id;
        res.redirect("/urls");
      }
    }
});

app.post("/logout", (req, res) => {
  // clear the cookie session when a user clicks the logout button
  req.session.user_id = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {

  const { email, password } = req.body

  // users are unable to register with empty fields
  if (!email || (!password)) {
    return res.status(400).send("Input fields cannot be empty. Please try again.");
  }
  // determine if user already exists in the database and send an error if true
  const userEmail = getUsersByEmail(req.body.email, users);
  if (userEmail) {
    return res.status(400).send("User already exists. Please try again.");
  }
  // else, create a new user in the database and redirect to the urls page
  let id = generateRandomString(12);
  const user = {
    id,
    email: req.body.email,
    password: hashedPassword,
  };
  users[id] = user;
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});