import { S3 } from "@aws-sdk/client-s3";
import { CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_SECRET_ACCESS_KEY } from "astro:env/server";

export const clientR2 = new S3({
    credentials: {
        accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
        accountId: CLOUDFLARE_ACCOUNT_ID,
    },
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});
