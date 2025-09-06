import { clientR2 } from "./clientR2";
import { sheets_v4 } from "@googleapis/sheets";
import { GoogleAuth } from "google-auth-library";
import type { ActionAPIContext } from "astro:actions";
import { CLOUDFLARE_BUCKET_NAME } from "astro:env/server";

let clientGoogleSheets: sheets_v4.Sheets | undefined = undefined;

export async function getClientGoogleSheets(context: ActionAPIContext) {
    if (clientGoogleSheets === undefined) {
        const googleObject = await clientR2.getObject({ Bucket: CLOUDFLARE_BUCKET_NAME, Key: "google.json" });
        const credentialsString = (await googleObject.Body?.transformToString()) ?? "";
        const credentials = JSON.parse(credentialsString);

        const auth = new GoogleAuth({
            credentials: credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        clientGoogleSheets = new sheets_v4.Sheets({ auth });
    }

    return clientGoogleSheets;
}
