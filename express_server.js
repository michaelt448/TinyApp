const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const PORT = 8080; // default port 8080

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

//local dataBase
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//local users
const users = {
  "A": {
    id: "A",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "B": {
    id: "B",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Generates Random string from of length 6 from combination of 6 lower case letters
const generateRandomString = function() {
  let length = 6;
  let word = '';
  while(length > 0) {
    let charCode = Math.floor(Math.random()*25 + 97);
    word += String.fromCharCode(charCode);
    length--;
  }
  return word;
}

//setUp
//End setUp


//Rootpage - prints hello in browser
app.get("/", (req, res) => {
  res.redirct ('/urls');
});

//hello extension - prints Hello world in browser
app.get('/hello', (req,res)=> {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET - urls extension - brings to a table of urls with tinyURL on left and Full URL to right
app.get('/urls', (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    username : req.cookies['username']
    };
  res.render('urls_index', templateVars);
})

// GET - page to make a new tinyURL for any URL
app.get('/urls/new', (req, res) => {
  let templateVars = {username : req.cookies['username']}
  res.render('urls_new', templateVars);
})

// GET - page to register for username with password
app.get('/register', (req,res) => {
  res.render('urls_registration');
})

// GET - sends user to URL using the current shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if(longURL === undefined) {
    res.send("no such shortURL was found");
  }
  res.redirect(longURL);
});

// GET - brings to a page which shows the shortURL for the specific URL
app.get('/urls/:shortURL', (req,res) => {
  let templateVars = { shortURL: req.params.shortURL,
                      longURL : urlDatabase[req.params.shortURL],
                      username : req.cookies['username']};
  res.render('urls_show', templateVars);
})

// POST - uses a generated String as shortURL and stores the shortURL to a URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// POST - deletes a url from the browse page
app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
})

//POST - updates the longURL to be diffrent URL
app.post("/urls/:id/update", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//POST - logs in the username name
app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls/');
});
//POST - deletes username from cookie, logs out
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls/')
});

//POST - adds a new user to the global user object and adds a cookie
app.post("/register",(req,res) => {
  const id = generateRandomString();
  users[id] = {
    id : id,
    email : req.body.email,
    password : req.body.password
  };
  res.cookie('user_id', id);
  console.log(id);
  console.log(users);
  res.redirect('/urls/');
})

// Runs servers on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});