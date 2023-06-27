const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
app.use(express.json());
const port = 35735;
let calculationsData = null;
app.use(express.static(path.join(__dirname)));

app.listen(35735, () => {
  console.log('Server is running on port 35735');
});

app.post('/generate-pdf', async (req, res) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:35735/index.html'); // Replace with your page URL

  // Use the calculated values saved previously
  const calculatedValues = calculationsData;
  console.log(calculatedValues);

  // Generate PDF here using Puppeteer's PDF generation methods
  const pdf = await page.pdf({ format: 'A4' });

  await browser.close();

  // Send the PDF as a response
  res.contentType("application/pdf");
  res.send(pdf);
});


app.post('/save-calculations', (req, res) => {
  calculationsData = req.body; // Save the calculations
  res.sendStatus(200);
});