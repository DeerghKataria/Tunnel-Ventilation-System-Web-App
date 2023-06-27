const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname));
app.use(express.json());
const port = 35735;
let calculationsData = null;

app.use(express.static(path.join(__dirname)));

app.listen(35735, () => {
  console.log('Server is running on port 35735');
});

app.get('/generate-pdf', async (req, res) => {
  try {
    // render ejs template and send it as a response
    res.render('template', { calculatedValues: calculationsData }, async (err, html) => {
      if (err) throw err;

      // initialize puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // set the HTML content of the new page
      await page.setContent(html);

      // generate PDF
      const pdf = await page.pdf({ format: 'A4' });

      // close browser
      await browser.close();

      res.setHeader('Content-Disposition', 'inline;'); // display in browser
      res.setHeader('Content-Type', 'application/pdf');
      res.header('Content-Disposition', 'inline; filename=Test.pdf'); // Set your custom file name here

      // send the PDF as a response
      res.contentType("application/pdf");
      res.send(pdf);
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});


app.post('/save-calculations', (req, res) => {
  calculationsData = req.body; // Save the calculations
  res.sendStatus(200);
});
