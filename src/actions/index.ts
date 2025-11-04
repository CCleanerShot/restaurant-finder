import { z } from "astro:schema";
import { utils } from "~/common/utils";
import type { CustomLocation, GoogleLocation } from "~/common/types";
import { clientSupabase } from "~/server/clientSupabase";
import { ActionError, defineAction } from "astro:actions";
import { customLocationSchema, googleLocationSchema } from "~/common/schemas.types";
import { GOOGLE_SHEETS_SPREADSHEET_ID } from "astro:env/server";
import { getClientGoogleSheets } from "~/server/clientGoogleSheets";
import { clientAnthropic } from "~/server/clientAnthropic";

export const server = {
    interpretMessage: defineAction({
        handler: async (input, context) => {
            const { locations, query } = input;

            const results: CustomLocation[] = [];
            const systemPrompt = `From the given query, only return a list of locations (separated by '|') that would closely match the description of the query. If you are unsure, simply return 'N/A'.`;
            const list = `Locations:\n${locations.map((e) => `${e.restaurant_name} (${e.category.replace(/(\s|restaurant)+/g, "")})`).join("\n")}`;
            const content = `${list}\n\nQuery:${query}`;

            const response = await clientAnthropic.messages.create({
                messages: [{ content: content, role: "user" }],
                model: "claude-sonnet-4-5-20250929",
                max_tokens: 2048,
                system: systemPrompt,
            });

            const item = response.content[0];

            if (item.type !== "text") {
                console.log("Warning: The LLM did not return a response with type of 'text', something has gone wrong!");
                return results;
            }

            const text = item.text;

            if (text === "N/A") {
                throw new ActionError({ code: "BAD_REQUEST", message: "The query passed in confused the LLM, or there are no locations to query on!" });
            }

            const names = text.split("|");

            // n^2 computation but idc
            for (const name of names) {
                const location = locations.find((e) => e.restaurant_name === name);

                if (location !== undefined) {
                    results.push(location);
                }
            }

            return results;
        },
        input: z.object({ locations: z.array(customLocationSchema), query: z.string() }),
    }),
    exportToGoogleSheets: defineAction({
        handler: async (input, context) => {
            const { locations } = input;

            try {
                const resultSheet = await (await getClientGoogleSheets()).spreadsheets.get({ spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID });

                if (!resultSheet.ok) {
                    console.log(`GOOGLE SHEETS ERROR: ${resultSheet.text()}`);
                    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected internal error" });
                }

                // TODO: make it more flexible
                const sheets = resultSheet.data.sheets ?? [];
                const { properties } = sheets.find((e) => e.properties?.title?.includes("TX"))!;
                const { title } = properties!;

                const resultCells = await (
                    await getClientGoogleSheets()
                ).spreadsheets.values.get({
                    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
                    range: title ?? "",
                });

                if (!resultCells.ok) {
                    console.log(`GOOGLE SHEETS ERROR: ${resultCells.text()}`);
                    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected internal error" });
                }

                const rows = resultCells.data.values ?? [];
                const columnNames: string[] = rows[0] ?? [];
                const columnAddress = columnNames.findIndex((e) => e.toLowerCase().includes("Address".toLowerCase()));
                const columnGoogleMaps = columnNames.findIndex((e) => e.toLowerCase().includes("Google".toLowerCase()));
                const columnIsClosed_1_Sunday = columnNames.findIndex((e) => e.toLowerCase().includes("Sunday".toLowerCase()));
                const columnIsClosed_2_Monday = columnNames.findIndex((e) => e.toLowerCase().includes("Monday".toLowerCase()));
                const columnIsClosed_3_Tuesday = columnNames.findIndex((e) => e.toLowerCase().includes("Tuesday".toLowerCase()));
                const columnIsClosed_4_Wednesday = columnNames.findIndex((e) => e.toLowerCase().includes("Wednesday".toLowerCase()));
                const columnIsClosed_5_Thursday = columnNames.findIndex((e) => e.toLowerCase().includes("Thursday".toLowerCase()));
                const columnIsClosed_6_Friday = columnNames.findIndex((e) => e.toLowerCase().includes("Friday".toLowerCase()));
                const columnIsClosed_7_Saturday = columnNames.findIndex((e) => e.toLowerCase().includes("Saturday".toLowerCase()));
                const columnID = columnNames.findIndex((e) => e.toLowerCase().includes(" ID".toLowerCase()));
                const columnName = columnNames.findIndex((e) => e.toLowerCase().includes("Name".toLowerCase()));
                const columnPhone = columnNames.findIndex((e) => e.toLowerCase().includes("Phone".toLowerCase()));
                const columnWebsite = columnNames.findIndex((e) => e.toLowerCase().includes("Website".toLowerCase()));

                const values = locations.map((e) => {
                    const array: string[] = [];

                    for (let i = 0; i < columnNames.length; i++) {
                        switch (i) {
                            case columnAddress:
                                array.push(e.address);
                                break;
                            case columnGoogleMaps:
                                array.push(utils.searchGoogleMaps(e.address));
                                break;
                            case columnIsClosed_1_Sunday:
                                array.push(e.hours_1_sunday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_2_Monday:
                                array.push(e.hours_2_monday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_3_Tuesday:
                                array.push(e.hours_3_tuesday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_4_Wednesday:
                                array.push(e.hours_4_wednesday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_5_Thursday:
                                array.push(e.hours_5_thursday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_6_Friday:
                                array.push(e.hours_6_friday_open ? "" : "CLOSED");
                                break;
                            case columnIsClosed_7_Saturday:
                                array.push(e.hours_7_saturday_open ? "" : "CLOSED");
                                break;
                            case columnID:
                                array.push(e.id);
                                break;
                            case columnName:
                                array.push(e.name);
                                break;
                            case columnPhone:
                                array.push(utils.phoneNumberStringToNumber(e.phone));
                                break;
                            case columnWebsite:
                                array.push(e.website);
                                break;
                            default:
                                array.push("");
                                break;
                        }
                    }

                    return array;
                });

                const resultAppend = await (
                    await getClientGoogleSheets()
                ).spreadsheets.values.append({
                    range: `A${rows.length + 1}`,
                    resource: { values: values },
                    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
                    valueInputOption: "USER_ENTERED",
                } as any);

                if (!resultAppend.ok) {
                    console.log(`GOOGLE SHEETS ERROR: ${resultAppend.text()}`);
                    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected internal error" });
                }

                // TODO: update existing rows for updated info. useful for when we add proper updates to the DB and when a restaurant is found before using the tool
            } catch (err) {
                console.log(`ERROR: `, err);
            }

            return "";
        },
        input: z.object({ locations: z.array(googleLocationSchema) }),
    }),
    searchNearby: defineAction({
        handler: async (input, context) => {
            const { lat, lng, radius } = input;
            const posLat = lat + utils.metersToCoord(radius);
            const negLat = lat - utils.metersToCoord(radius);
            const posLng = lng + utils.metersToCoord(radius);
            const negLng = lng - utils.metersToCoord(radius);

            const query = await clientSupabase
                .from("restaurants")
                .select("*")
                .gte("latitude", negLat)
                .lte("latitude", posLat)
                .gte("longitude", negLng)
                .lte("longitude", posLng);

            if (query.error) {
                console.log(`SUPABASE ERROR: ${query.error.message}`);
                throw new ActionError({ code: "BAD_REQUEST", message: "Bad request, dunno yet tho." });
            }

            const places: GoogleLocation[] = query.data.map((e) => ({
                address: e.address,
                coord: { x: e.longitude, y: e.latitude },
                id: e.place_id,
                hours_1_sunday_open: e.hours_1_sunday_open,
                hours_2_monday_open: e.hours_2_monday_open,
                hours_3_tuesday_open: e.hours_3_tuesday_open,
                hours_4_wednesday_open: e.hours_4_wednesday_open,
                hours_5_thursday_open: e.hours_5_thursday_open,
                hours_6_friday_open: e.hours_6_friday_open,
                hours_7_saturday_open: e.hours_7_saturday_open,
                name: e.restaurant_name,
                phone: e.phone,
                website: e.website,
            }));

            return places;
        },

        input: z.object({ lat: z.number(), lng: z.number(), radius: z.number() }),
    }),
};
