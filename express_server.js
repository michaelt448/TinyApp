const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const PORT = 8080; // default port 8080

// SET UP
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name : 'session',
  keys : ['key1'],
  maxAge : 1000*60*60
}));
app.set('view engine', 'ejs');
// SET UP ENDS

// The database for all users, key corresponds to short URL with object value containing email, encrypted pass, and full URL
const urlDatabase = {
};

// local users data base, key for user is cookie, value is object with cookie, email, and password
const users = {
};



// GET - ROOTPAGE - redirects person to login if not logged in, otherwise redirect person to the index page.
app.get('/', (req, res) => {
  if(req.session.user_id === undefined) {
    res.redirect('/login');
  }else {
  res.redirect('/urls');
  }
});

// GET - /hello - hello extension - prints Hello world in browser
app.get('/hello', (req,res)=> {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET - /urls - RENDERS urls_index onto /urls, passing in individual userDB and user_id from cookie
app.get('/urls', (req,res) => {
  const userDB = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: userDB,
    user_id : users[req.session.user_id]
    };
    res.render('urls_index', templateVars);
});



// GET - /urls/new - renders urls to make new URL, if not logged in redirects to loggin otherwise renders urls_new
app.get('/urls/new', (req, res) => {
  if(req.session.user_id === undefined) {
    res.status(400).redirect('/login');
  }else {
    let templateVars = {
      user_id : users[req.session.user_id]
    }
    res.render('urls_new', templateVars);
  }
});

// GET - /login - if logged in than redirects to index, otherwise will render a login page
app.get('/login', (req,res) => {
  if(req.session.user_id === undefined){
    let templateVars = {
      error : [false]
    };
    res.render('urls_login', templateVars);
  }else {
    res.status(400).redirect('/urls');
  }
});

// GET - /register - if logged in than redirects to index, otherwise will render a register page
app.get('/register', (req,res) => {
  if(req.session.user_id === undefined){
    let templateVars = {
      error : [true]
    }
  res.render('urls_registration',templateVars);
  }else {
    res.status(400).redirect('/urls');
  }
});



//                                 GET MESSAGE TAKE A PAREMETER, ANY GET MESSAGE PUT BEFORE
// GET - /u/: - sends user to longURL using the current shortURL, gives error back if there is no such URL
// @parm - shortURL, the URL which should redirect to the long URL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if(longURL === undefined) {
    res.status(404).send('no such shortURL was found');
  }
  res.redirect(longURL);
});

// GET - /urls/: - bring to a page which short the shortURL for the longURL
// @param shortURL : the shortURL matching to the longURL
app.get('/urls/:shortURL', (req,res) => {
  if(urlDatabase[req.params.shortURL] === undefined){
    res.status(404).send('the URL you are trying to access does not exist');
  } else {
  if(urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    const userDB = urlsForUser(req.session.user_id);
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL : userDB[req.params.shortURL],
      user_id : users[req.session.user_id]
    };
    res.render('urls_show', templateVars);
  }else {
    res.status(402).send('You do not have access to the page');
  }
}
});


//                            POST BEGINS HERE

// POST - /urls/ - uses a generated a Random String to be shortURL for a long URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL : req.body.longURL,
    userID : req.session.user_id
  }
  res.redirect(`/urls/${shortURL}`);
});

// POST - /urls/:/delete - deletes a url from the data base and from the browser page if has access
// otherwise sends error
app.post('/urls/:id/delete', (req,res) => {
  if(urlDatabase[req.params.id].longURL === undefined){
    res.statues(404).send('the URL you are trying to acces does not exist');
  }else {
    if(urlDatabase[req.params.id].userID === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect("/urls/");
    }else {
      res.status(403).send('you do not have premission to delete this');
    }
  }
});

// POST - /urls/:/update - updates the value the longURL stored under specific key shortURL to
// diffrent longURL returns error if it does not have premission
app.post('/urls/:id/update', (req, res) => {
  if(urlDatabase[req.params.id].longURL === undefined) {
    res.status(404).send('the url you are looking for does not exist');
  }else {
    if(urlDatabase[req.params.id].userID === req.session.user_id){
      let shortURL = req.params.id;
      urlDatabase[shortURL].longURL = req.body.longURL;
      res.redirect(`/urls/`);
    }else {
      res.status(403).send('you do not have premission to update this');
      }
  }
});

// POST - /login - if email and password are valid redirects to /urls otherwise passes back an error
app.post("/login", (req, res) => {
  let [user_id,error] = checkEmail(req.body.email,req.body.password);
  let templateVars = {
    error : error
  };
  if(error[0]) {
    res.status(403).render('urls_login',templateVars);
  }else {
    req.session.user_id = user_id;
    res.redirect('/urls/');
    }
});
// POST - /logout - deletes user_id from cookie, logs out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls/')
});

// POST - adds a new user to the global user object and adds a cookie
app.post("/register",(req,res) => {
  let error = checkRegistrationErrors(req.body.email,req.body.password);
  let templateVars = {error : error};
  if(error[0]) {
    res.status(400).render('urls_registration',templateVars);
  }else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const id = generateRandomString();
    users[id] = {
      id : id,
      email : req.body.email,
      password : hashedPassword
    };
    req.session.user_id = id;
    res.redirect('/urls/');
  }
});

// Runs servers on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


//                           HELPER FUNCTIONS BEGIN HERE
// Helper function Generates Random string from of length 6 from combination of 6 lower case letters
// @ret a randomly generated string
const generateRandomString = function() {
  let length = 6;
  let word = '';
  while(length > 0) {
    let charCode = Math.floor(Math.random()*25 + 97);
    word += String.fromCharCode(charCode);
    length--;
  }
  return word;
};



// Helper function which checks that the email and password are not empty
// @param email : 'string' which is email of person
// @param password : 'string' which is the password inputed by user
// @retr error: array of size 2, first entry containing boolean, true if there is error, false else,
// second entry containing error message

const checkEmpties = (email, password) => {
  let error = [false];
  if(email === '') {
    error = [true,'please put in a username'];
  } else if(password === '') {
    error = [true, 'please put in a password'];
  }
  return error;
};

// Helper checks if there is any registration errors
// @param email : 'string' which is email of person
// @param password : 'string' which is the password inputed by user
// @retr error: array of size 2, first entry containing boolean, true if there is error, false else,
// second entry containing error message

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
};

// Helper function which checks whether email and password is in the database and match for LOGIN
// If there are errors, the username sent back is empty string
// @param email : 'string' which is email of person
// @param password : 'string' which is the password inputed by user
// @retr error: array of size 2, first entry containing boolean, true if there is error, false else,
// second entry containing error message
const checkEmail = (email,password) => {
  let error = checkEmpties(email,password);
  if(error[0]) {
    return ['', error];
  }
  for(let user in users) {
    if(users[user].email === email) {
      if(bcrypt.compareSync(password, users[user].password)){
        return [users[user].id,error];
      }
      else{
      return ['',[true,'Wrong password']]
      }
    }
  }
  return ['',[true,'The username was not found']];
};

// Helper function which bring back individual database for the user from userID
// @ param userID: 'string' cookie which is used to compare to general database
// @ retr userDB: object with key value where key is smallURL and value is longURL
const urlsForUser = (userID) => {
  const userDB = {};
  for(let smallURL in urlDatabase) {
    if(urlDatabase[smallURL].userID === userID) {
      userDB[smallURL] = urlDatabase[smallURL].longURL;
    }
  }
  return userDB;
}

