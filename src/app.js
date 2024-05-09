const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression'); 
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

require('dotenv').config();

const middlewares = require('./middlewares');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(compression()); // Enable compression
app.use(express.json());


// Initialize Firebase app
// const serviceAccount = process.env.FIREBASE_CREDENTIALS
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Function to generate a license key
const generateLicenseKey = () => {
  const characters = 'ABCDGHIJKMNOPRTUVWXYZ01235789';
  const licenseKey = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => characters[Math.floor(Math.random() * characters.length)]).join('')).join('-');
  return licenseKey;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  port: 465,
  secure: true
});


// Function to send email
const sendEmail = async (to, subject, licenseKey) => {
  const htmlContent = `
  <html lang="en">
    
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  
  <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width: 400px; margin: 20px auto; background-color: #fff; border: 1px solid #ddd; border-top: 0;">
          <tr>
              <td style="padding: 20px; text-align: center;">
                  <h1 style="font-size: 24px; font-weight: bold; color: #555; margin: 10px 0;">CRM Test Mail</h1>
                  <p style="text-align: left;font-size: 16px; line-height: 22px; color: #555; margin: 50px 0 10px 0;">Hello!</p>
                  <p style="text-align: left;font-size: 16px; line-height: 22px; color: #555; margin: 20px 0 40px 0;">This is a test email from the CRM Software</p>
                  <div style="margin: 20px 0; display: table; width: 100%;">
                      <div style="display: table-cell; vertical-align: middle; text-align: center;">
                          <p style="background-color: #2F67F6; color: #fff; text-decoration: none; padding: 8px 12px; border-radius: 3px; display: inline-block; font-weight: bold; margin: 0;">${licenseKey}</p>
                      </div>
                  </div>
                  <div style="text-align: left; margin-top: 40px;">
                      <p style="text-align: left;font-size: 16px; line-height: 22px; color: #555; margin: 15px 0 30px 0;">
                          Thank you,
                      </p>
                      <p style="text-align: left;font-size: 16px; line-height: 22px; color: #555; margin: 15px 0 10px 0;">
                          Kind regards, 
                      </p>
                      <p style="text-align: left;font-size: 16px; line-height: 22px; color: #555; margin: 10px 0 10px 0;font-weight: bold;">
                          CRM Team
                      </p>
                  </div>
              </td>
          </tr>
      </table>
  
  </body>
  
  </html>
  `;
  

  const mailOptions = {
    from: 'CRM Team <' + process.env.GMAIL_USER + '>',
    to,
    subject,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};

app.post('/send_email', async (req, res) => {
  const data = req.body;

  // Assuming you have an 'email' field in your request data
  const to = data.Email;
  const subject = 'CRM Team, Test Mail is here 😀';
  try {
    await sendEmail(to, subject, data.License_Key);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
  
  res.json({ message: 'Email sent successfully' });
});

// Route to add a user
app.post('/add_user', (req, res) => {
  const newUser = req.body.Data;
  const usersRef = admin.database().ref('/Users');

  if (newUser.length === 1) {
    newUser[0].License_Key = generateLicenseKey();
    usersRef.push(newUser[0]);
    res.json(newUser[0]);
  } else if (newUser.length > 1) {
    newUser.forEach(user => {
      user.License_Key = generateLicenseKey();
      usersRef.push(user);
    });
    res.json(newUser);
  }
});

// Route to find user by email or license key
app.get('/find_user', (req, res) => {
  const email = req.query.email;
  const licenseKey = req.query.license_key;
  const usersRef = admin.database().ref('/Users');

  usersRef.orderByChild('Email').equalTo(email).once('value')
    .then(snapshot => {
      const userData = snapshot.val();

      if (userData) {
        const userId = Object.keys(userData)[0];
        const userInfo = userData[userId];

        if (userInfo.License_Key === licenseKey) {
          res.json({ [userId]: userInfo });
        } else {
          res.status(401).json({ error: 'License key does not match' });
        }
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
});

// Route to delete user
app.post('/delete_user', (req, res) => {
  const licenseKey = req.body.License_Key;
  const usersRef = admin.database().ref('/Users');

  usersRef.orderByChild('License_Key').equalTo(licenseKey).once('value')
    .then(snapshot => {
      const userData = snapshot.val();

      if (userData) {
        const userId = Object.keys(userData)[0];
        usersRef.child(userId).remove();
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    });
});

// Route to fetch all users
app.get('/fetch', (req, res) => {
  const usersRef = admin.database().ref('/Users');

  usersRef.once('value')
    .then(snapshot => {
      const userData = snapshot.val();
      const userArray = userData ? Object.values(userData) : [];
      res.json(userArray);
    });
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
