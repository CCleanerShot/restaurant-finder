import google from "googleapis";

const auth = new google.Auth.GoogleAuth({
    keyFile: "./google.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const clientGoogleSheets = new google.sheets_v4.Sheets({ auth });
