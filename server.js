require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { check, validationResult } = require("express-validator");
const sendEmail = require("./middleware/email");
const { google } = require("googleapis");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`listining on port ${PORT}`));

app.get("/", (req, res) => {
  res.status(200).send("The Open Gate Server Engaged");
});

app.post(
  "/",
  [
    check("first_name").not().isEmpty().trim(),
    check("last_name").not().isEmpty().trim(),
    check("gender").not().isEmpty().trim(),
    check("address").not().isEmpty().trim(),
    check("city").not().isEmpty().trim(),
    check("country").not().isEmpty().trim(),
    check("state").not().isEmpty().trim(),
    check("interests").not().isEmpty().trim(),
    check("occupation").not().isEmpty().trim(),
    check("phone").not().isEmpty().trim(),
    check("postal_code").not().isEmpty().trim(),
    check("area_of_specialization").not().isEmpty().trim(),
    check("date_of_birth").not().isEmpty().trim(),
    check("education").not().isEmpty().trim(),
    check("email").not().isEmpty().trim().isEmail(),
  ],
  async (req, res) => {
    const form = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: "creds.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = process.env.SPREAD_SHEET_ID;

    const formattedList = [
      "first_name",
      "last_name",
      "gender",
      "date_of_birth",
      "nic",
      "address",
      "country",
      "state",
      "city",
      "postal_code",
      "email",
      "phone",
      "education",
      "occupation",
      "interests",
      "area_of_specialization",
      "method_of_communication",
      "add_to_whatsapp_group",
    ];

    let formattedObj = {};

    formattedList.forEach((field) => {
      formattedObj[field] = form[field];
    });

    const data = Object.values(formattedObj);

    // Write row(s) to spreadsheet
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Sheet1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [data],
      },
    });

    //send email
    try {
      await sendEmail({
        from: '"The Open Gate" <theopengatelk@gmail.com>', // sender address
        to: form.email, // list of receivers
        subject:
          "[theopengatelk] Congratulations! You are now part of the family!",
        html: `
      <p>Dear ${form.first_name} ${form.last_name}</p>
      <p></p>
      <p>Welcome to The Open Gate!</p>

      <p>We received your application and we are glad to have you join as a member of our organization. Hoping to work with you very soon :) </p>

      <p>Best regards,</p>
      <p>The Open Gate Team</p>
      `,
      });
    } catch (error) {
      console.log(error);
    }

    res.status(200).json(form);
  }
);

