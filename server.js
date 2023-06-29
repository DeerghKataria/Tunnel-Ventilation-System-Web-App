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
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public'))); // Add this line here

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
const url = "mongodb+srv://hitesh_khanna:AnandMincons@cluster0.sc5xhui.mongodb.net/";
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
  try {
      await client.connect();
      const db = client.db(dbName);
      const users = db.collection('users');

      const user = await users.findOne({ username: req.body.username });
      if (user) {
          const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
          if (isPasswordCorrect) {
              // Save user details and isAdmin flag in the session
              req.session.user = { username: user.username, isAdmin: user.isAdmin };
              // Redirect based on user type
              if (user.isAdmin) {
                  res.redirect('/admin');
              } else {
                  res.redirect('/index.html');
              }
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

app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
      if(err) {
          console.log(err);
      } else {
          res.redirect('/login'); // or redirect to any other page
      }
  });
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

app.get('/generate-pdf', async (req, res) => {
  const client = new MongoClient(url);
  let calculatedValues = null;

  try {
    await client.connect();
    const db = client.db(dbName);
    const calculations = db.collection('Calculations');
    // Get the latest document in the collection
    calculatedValues = await calculations.find().sort({ createdAt: -1 }).limit(1).next();
    console.log('Calc Values');
    console.log(calculatedValues);
  } catch (err) {
    console.error('Error retrieving calculations:', err);
  } finally {
    await client.close();
  }

  // Check if calculatedValues.data exists and pass it to the template
  if (calculatedValues && calculatedValues.data) {
    res.render('template', { calculatedValues: calculatedValues.data.calculations });
  } else {
    res.status(500).send('Error: No data found for PDF generation');
  }
});


app.get('/admin', async (req, res) => {
  // Check if the user is logged in and is an admin
  if (req.session.user && req.session.user.isAdmin) {
    const client = new MongoClient(url);
    try {
      await client.connect();
      const db = client.db(dbName);
      const projects = db.collection('PDF-Data');
      
      const allProjects = await projects.find().toArray();
      console.log(allProjects);  // Add this line
      res.render('admin', { projects: allProjects });
    } finally {
      await client.close();
    }
  } else {
    res.redirect('/login');
  }
});




app.post("/save-calculations", async (req, res) => {
  console.log('Received data:', req.body); // log incoming request data
  calculationsData = req.body; // Save the calculations
  console.log('Calculations received:', calculationsData); // log saved calculations

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const calculations = db.collection('Calculations');
    
    const result = await calculations.insertOne({
      data: calculations, 
      createdAt: new Date(),
    });

    console.log('Inserted document with ID:', result.insertedId); // log the id of the inserted document
  } catch(err) {
    console.error('Failed to save calculations:', err); // log any errors
  } finally {
    await client.close();
  }

  res.sendStatus(200);
});


async function generatePdf(calculatedValues) {
  return new Promise((resolve, reject) => {
    // render your ejs template with data
    ejs.renderFile(path.join(__dirname, 'template.ejs'), { calculatedValues }, async function(err, html){
      if (err){
        console.error('Error in rendering ejs:', err);
        reject(err); // if there is an error, reject the Promise
      }

      try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
      
        await page.setContent(html);
        const pdfBuffer = await page.pdf({ format: 'A4' });
      
        await browser.close();

        resolve(pdfBuffer); // if everything went fine, resolve the Promise with the pdfBuffer
      } catch (error) {
        console.error('Error in generating PDF:', error);
        reject(error); // if there is an error, reject the Promise
      }
    });
  });
}


app.post('/save-project', async (req, res) => {
  const {calculations } = req.body;

  // Generate and save PDF
  console.log("Showing Calculations");
  console.log(calculations);
  const pdfBuffer = await generatePdf(calculations); // replace this with your PDF generation logic

  // Check if directory exists, if not, create it
  const dir = path.join(__dirname, 'public', 'pdfs');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  const pdfPath = path.join(dir, `${calculations.projectName}.pdf`);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const pdfUrl = `/pdfs/${calculations.projectName}.pdf`;

  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const projects = db.collection('PDF-Data');
    
    const result = await projects.insertOne({
      calculations,
      pdfUrl
    });

    res.sendStatus(200);
  } finally {
    await client.close();
  }
});
