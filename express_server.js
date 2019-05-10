const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const PORT = 8080; // default port 8080

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name : 'session',
  keys : ['key1'],
  maxAge : 1000*60*60
}));
app.set('view engine', 'ejs');


//local dataBase
const urlDatabase = {
  // "b2xVn2": "http://www.lighthouselabs.ca",
  // "9sm5xK": "http://www.google.com"
  //    b6UTxQ: {
  //   longURL: "https://www.tsn.ca",
  //   userID: "aJ48lW"
  //    },
  // i3BoGr: {
  //   longURL: "https://www.google.ca",
  //   userID: "aJ48lW"
  // }
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
  res.redirect ('/urls');
});

//hello extension - prints Hello world in browser
app.get('/hello', (req,res)=> {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET - urls extension - brings to a table of urls with tinyURL on left and Full URL to right
app.get('/urls', (req,res) => {
  //console.log(req.session.user_id);
    const userDB = urlsForUser(req.session.user_id);
    // console.log('this is my data base', userDB)
    // console.log('this is the general db', urlDatabase );
    console.log('HELELLOWJIOJDF');
    let templateVars = {
      urls: userDB,
      user_id : users[req.session.user_id]
      };
    res.render('urls_index', templateVars);
});

//Helper function which checks through the dataBase of the logged in user and brings back their URLs
const urlsForUser = (userID) => {
  //console.log('I am here', userID);
  const userDB = {};
  for(smallURL in urlDatabase) {
    // console.log('current small URL', smallURL);
    // console.log('this is the the id which should be matched', userID);
    // console.log('this is the db', urlDatabase);
    if(urlDatabase[smallURL].userID === userID) {
      userDB[smallURL] = urlDatabase[smallURL].longURL;
    }
  }
  //console.log(userDB);
  return userDB;
}

// GET - page to make a new tinyURL for any URL
app.get('/urls/new', (req, res) => {
  if(req.session.user_id === undefined) {
    res.redirect('/login');
  }
  else {
    let templateVars = {user_id : req.session.user_id}
    res.render('urls_new', templateVars);
  }
});

//GET - renders a login page
app.get('/login', (req,res) => {
  let templateVars = {
    error : [false]
  };
  res.render('urls_login', templateVars);
});

// GET - page to register for user_id with password
app.get('/register', (req,res) => {
  let templateVars = {
    error : [true]
  }
  res.render('urls_registration',templateVars);
});

// GET - sends user to URL using the current shortURL
app.get("/u/:shortURL", (req, res) => {
  const userDB = urlsForUser(req.session.user_id);
  const longURL = userDB[req.params.shortURL];
  if(longURL === undefined) {
    res.send("no such shortURL was found");
  }
  res.redirect(longURL);
});

// GET - brings to a page which shows the shortURL for the specific URL
app.get('/urls/:shortURL', (req,res) => {
    // console.log('this is the paremeters', urlDatabase[req.params.shortURL].userID);
    // console.log('this is my my cookie', req.cookies['user_id']);
    if(urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    const userDB = urlsForUser(req.session.user_id);
    // console.log('this is an updated db', urlDatabase);
    // console.log('this is an updated userDB', userDB);
    // console.log('this is suppose to be long url',userDB[req.params.shortURL]);
    let templateVars = { shortURL: req.params.shortURL,
                       longURL : userDB[req.params.shortURL],
                        user_id : req.session.user_id};
    res.render('urls_show', templateVars);
  }
  else {
    res.send("You do not have access to the page");
  }
})

// POST - uses a generated String as shortURL and stores the shortURL to a URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  // console.log('this is my short URL', shortURL);
  urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.session.user_id
  }
  console.log('this db should be updated', urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// POST - deletes a url from the browse page
app.post("/urls/:id/delete", (req,res) => {
  // console.log('this is the db', urlDatabase);
  // console.log('this is the cookie', req.cookies['user_id']);
  // console.log('this is the paremeters', req.params);
  // console.log('this is the shortURL', urlDatabase[req.params.id]);
  if(urlDatabase[req.params.id].userID === req.session.user_id){
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
  } else {
    res.send('you do not have premission to delete this');
  }

})

//POST - updates the longURL to be diffrent URL
app.post("/urls/:id/update", (req, res) => {
  if(urlDatabase[req.params.id].userID === req.session.user_id){
    let shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
  }
});

//POST - logs in the user_id name
app.post("/login", (req, res) => {
  let email = req.body.email;
  [user_id,error] = checkEmail(req.body.email,req.body.password);
  let templateVars = {error : error};
  if(error[0]) {
    res.status(400);
    res.render('urls_login',templateVars);
  }
  else {
    req.session.user_id = user_id;
    res.redirect('/urls/');
  }
});
//POST - deletes user_id from cookie, logs out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls/')
});

//POST - adds a new user to the global user object and adds a cookie
app.post("/register",(req,res) => {
  let error = checkRegistrationErrors(req.body.email,req.body.password);
  let templateVars = {error : error};
  if(error[0]) {
    res.status(400);
    res.render('urls_registration',templateVars);
  }
  else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    console.log('this is the regular password', req.body.password);
    console.log('this is the hashed password', hashedPassword);
    const id = generateRandomString();
    users[id] = {
      id : id,
      email : req.body.email,
      password : hashedPassword
    };
    req.session.user_id = id;
    res.redirect('/urls/');
  }
})

//Helper function which checks that the email and password are not empty
// sends back a status
const checkEmpties = (email, password) => {
  //console.log(password);
  let error = [false];
  if(email === '') {
    error = [true,'please put in a username'];
  } else if(password === '') {
    error = [true, 'please put in a password'];
  }
  return error;
}

// Helper checks if there is any registration errors
const checkRegistrationErrors = (email,password) => {
  let error = checkEmpties(email,password);
  if(error[0]) {
    return error;
  }
  for(id in users) {
    if(users[id].email === email) {
      error = [true, 'You are alread registered!!'];
      break;
    }
  }
  return error;
}

//Helper function which checks whether email is in the database
// If there are errors, the username sent back is empty string, emtpy string should not register for user name
const checkEmail = (email,password) => {
  let error = checkEmpties(email,password);
  if(error[0]) {
    return ['', error];
  }
  for(user in users) {
    if(users[user].email === email) {
      // console.log('This is the passed in password', password);
      // console.log('This is the password in db', users[user].password);
      if(bcrypt.compareSync(password, users[user].password)){
        return [users[user].id,error];
      }
      else{
      return ['',[true,'Wrong password']]
      }
    }
  }
  return ['',[true,'The username was not found']];
}

// Runs servers on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});