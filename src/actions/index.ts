import { z } from "astro:schema";
import { utils } from "~/common/utils";
import type { CustomLocation, GoogleLocation } from "~/common/types";
import { clientSupabase } from "~/server/clientSupabase";
import { ActionError, defineAction } from "astro:actions";
import { customLocationSchema, googleLocationSchema } from "~/common/schemas.types";
import { GOOGLE_SHEETS_SPREADSHEET_ID } from "astro:env/server";
import { getClientGoogleSheets } from "~/server/clientGoogleSheets";
<<<<<<< HEAD
import { clientAnthropic } from "~/server/clientAnthropic";
=======
import { OPENAI_API_KEY } from "astro:env/server";
>>>>>>> 3a576d7365a815879065762a621af2ce316cbdae

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
    classifyLocations: defineAction({
        handler: async (input, context) => {
            const { sessionId, message, locations } = input;

            if (!OPENAI_API_KEY) {
                throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "OpenAI API key not configured" });
            }

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `You are a helpful assistant that analyzes restaurant locations based on user queries. 
For each location provided, return a relevance score from 0.0 to 1.0 based on how well it matches the user's query.
Also provide a helpful conversational response about the locations.

Return your response as JSON with this exact format:
{
  "relevanceScores": [{"locationId": "id1", "score": 0.9}, {"locationId": "id2", "score": 0.3}, ...],
  "response": "Your conversational response here"
}`,
                            },
                            {
                                role: "user",
                                content: `User query: "${message}"

Locations to analyze:
${JSON.stringify(locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    category: (loc as any).category || "",
    price_range: (loc as any).price_range || "",
    review_points: (loc as any).review_points || 0,
})))}`,
                            },
                        ],
                        response_format: { type: "json_object" },
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("OpenAI API error:", response.status, errorText);
                    throw new Error(`OpenAI API error: ${response.statusText}. Please check your API key.`);
                }

                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error("Invalid response format from OpenAI");
                }
                
                const content = JSON.parse(data.choices[0].message.content);

                return {
                    relevanceScores: content.relevanceScores || [],
                    response: content.response || "I couldn't generate a response. Please try again.",
                };
            } catch (err: any) {
                console.error("OpenAI classification error:", err);
                const errorMessage = err?.message || "Failed to classify locations";
                throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: errorMessage });
            }
        },
        input: z.object({
            sessionId: z.string(),
            message: z.string(),
            locations: z.array(z.any()),
        }),
    }),
};
