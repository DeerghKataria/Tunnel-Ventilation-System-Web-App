const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const session = require("express-session");
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json()); // support parsing of application/json type post data
app.use(bodyParser.urlencoded({ extended: true })); //support parsing of application/x-www-form-urlencoded post data

app.set("view engine", "ejs");
app.set("views", path.join(__dirname));
app.use(express.json());
app.use(
  session({
    secret: "your-secret-key", // replace with a real secret in production
    resave: false,
    saveUninitialized: false,
  })
);
const port = 35735;
let calculationsData = null;

app.listen(35735, () => {
  console.log("Server is running on port 35735");
});

// User Authentication routes
const url =
  "mongodb+srv://hiteshwork0811:AnandMincons@anandmincons.uiornam.mongodb.net/"; // REPLACE WITH YOUR MONGODB URL
const dbName = "AnandMincons"; // REPLACE WITH YOUR DATABASE NAME

app.get("/login", function (req, res) {
  res.sendFile(path.join(__dirname, "/loginpage.html"));
});

app.get("/register", function (req, res) {
  res.sendFile(path.join(__dirname, "/register.html"));
});

app.post('/register', async (req, res) => {
  const client = new MongoClient(url);
  try {
      await client.connect();
      const db = client.db(dbName);
      const users = db.collection('users');

      // Check if user already exists
      const existingUser = await users.findOne({ username: req.body.username });
      if (existingUser) {
          res.status(400).send({ error: 'Username already taken' });
          return;
      }

      // Hash the password - never store passwords in plaintext!
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = { username: req.body.username, password: hashedPassword };
      const result = await users.insertOne(user);

      res.send({ success: true, id: result.insertedId });
  } finally {
      await client.close();
  }
});



app.post('/login', async (req, res) => {
  const client = new MongoClient(url);
  console.log(req.body);
  try {
      await client.connect();
      const db = client.db(dbName);
      const users = db.collection('users');

      const user = await users.findOne({ username: req.body.username });
      if (user) {
          const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
          if (isPasswordCorrect) {
              req.session.user = user;
              res.redirect('/index.html');
          } else {
              res.status(401).send({ error: 'Incorrect password' });
          }
      } else {
          res.status(404).send({ error: 'User not found' });
      }
  } finally {
      await client.close();
  }
});


function checkAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.use(checkAuthenticated);
app.use(express.static(path.join(__dirname)));

app.get("/generate-pdf", async (req, res) => {
  try {
    // render ejs template and send it as a response
    res.render(
      "template",
      { calculatedValues: calculationsData },
      async (err, html) => {
        if (err) throw err;

        // initialize puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // set the HTML content of the new page
        await page.setContent(html);

        // generate PDF
        const pdf = await page.pdf({ format: "A4" });

        // close browser
        await browser.close();

        res.setHeader("Content-Disposition", "inline;"); // display in browser
        res.setHeader("Content-Type", "application/pdf");
        res.header("Content-Disposition", "inline; filename=Test.pdf"); // Set your custom file name here

        // send the PDF as a response
        res.contentType("application/pdf");
        res.send(pdf);
      }
    );
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.post("/save-calculations", (req, res) => {
  calculationsData = req.body; // Save the calculations
  res.sendStatus(200);
});
