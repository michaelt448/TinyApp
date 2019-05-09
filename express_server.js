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
  res.redirect ('/urls');
});

//hello extension - prints Hello world in browser
app.get('/hello', (req,res)=> {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET - urls extension - brings to a table of urls with tinyURL on left and Full URL to right
app.get('/urls', (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id : users[req.cookies['user_id']]
    };
  res.render('urls_index', templateVars);
});

// GET - page to make a new tinyURL for any URL
app.get('/urls/new', (req, res) => {
  let templateVars = {user_id : req.cookies['user_id']}
  res.render('urls_new', templateVars);
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
                      user_id : req.cookies['user_id']};
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
    res.cookie('user_id', user_id);
    res.redirect('/urls/');
  }
});
//POST - deletes user_id from cookie, logs out
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
    const id = generateRandomString();
    users[id] = {
      id : id,
      email : req.body.email,
      password : req.body.password
    };
    res.cookie('user_id', id);
    res.redirect('/urls/');
  }
})

//Helper function which checks that the email and password are not empty
// sends back a status
const checkEmpties = (email, password) => {
  console.log(password);
  let error = [false];
  if(email === '') {
    console.log('inside checking empty email');
    error = [true,'please put in a username'];
  } else if(password === '') {
    console.log('inside checking empty password')
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
    console.log('HELLO BUGGY');
    return ['', error];
  }
  for(user in users) {
    if(users[user].email === email) {
      return [users[user].id,error];
    }
  }
  return ['',[true,'The username was not found']];
}

// Runs servers on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});