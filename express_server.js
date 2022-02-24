const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// const morgan = require('morgan');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "user2RandomID"
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "456",
  },
};

function generateRandomString(length) {
  // length = 6;
  let randomString = "";
  let characters =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i <= length - 1; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
}

const emailLookUp = (email, users) => {
  const userKeys = Object.keys(users);
  for (const user of userKeys) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// sending data to urls_index
app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  console.log("user:", users);
  const templateVars = {
    user,
    urls: urlsForUser(users[user]),
  };
  if (!templateVars.user) {
    return res.status(403).send("Please <a href='/login'>login</a> to access.");
  }
  res.render("urls_index", templateVars);
});

// rendering urls_new
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"] || null,
  };
  if (templateVars.user == null) {
    return res.redirect(403, "/login");
  }
  res.render("urls_new", templateVars);
});

// redirects to its long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// rendering urls_show
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    shortURL: req.params.shortURL,
  };
  if (urlDatabase[req.params.shortURL] == undefined) {
    res.status(404).send("ID does not exist.");
    return;
  }
  longURL = urlDatabase[req.params.shortURL].longURL
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;

  console.log(req.body); // Log the POST request body to the console

  // updates database with new URL
  urlDatabase[shortURL] = {
    longURL,
    user: req.cookies["user_id"],
  }
  res.redirect(`/urls/${shortURL}`);
});

// removes URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// updates a URL resource
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  const userEmail = emailLookUp(req.body.email, users);
  for (userKey in users) {
    if (userEmail === null) {
      res.status(403).send("User cannot be found.");
    }
    if (userEmail) {
      if (users[userKey].password !== password) {
        res.status(403).send("Email or password is incorrect.");
        return;
      } else {
        res.cookie("user_id", userKey);
        res.redirect("/urls");
      }
    }
  }
});

app.post("/logout", (req, res) => {
  const { user } = req.body;
  res.clearCookie("user_id", user);
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  let id = generateRandomString(12);
  const user = {
    id,
    email: req.body.email,
    password: req.body.password,
  };
  users[id] = user;

  if (user.email == "" || user.password == "") {
    res.status(400).send("Input fields cannot be empty. Please try again");
    return;
  }

  const userEmail = emailLookUp(req.body.email, users);
  if (userEmail) {
    res.status(400).send("User already exists. Please try again.");
  }
  // user[id] = user;
  res.cookie("user_id", user);
  console.log("Users Object:", users);
  res.redirect("/urls");
});
