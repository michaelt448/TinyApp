const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require('body-parser');

//local dataBase
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
//End setUp


//Rootpage - prints hello in browser
app.get("/", (req, res) => {
  res.send("Hello!");
});

//hello extension - prints Hello world in browser
app.get('/hello', (req,res)=> {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET - urls extension - brings to a table of urls with tinyURL on left and Full URL to right
app.get('/urls',(req,res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
})

// GET - page to make a new tinyURL for any URL
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
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
  let templateVars = { shortURL: req.params.shortURL, longURL : urlDatabase[req.params.shortURL] };
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
  console.log(req.params);
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
})

// Runs servers on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});