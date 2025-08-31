import type { APIRoute } from "astro";

// TODO: get api routes working
export const GET: APIRoute = ({ params, request }) => {
    console.log(params, request);
    return new Response();
};
