export const utils = {
    round: (number: number, places: number) => {
        return Math.round(number * Math.pow(10, places)) / Math.pow(10, places);
    },
    searchGoogleMaps: (location: string): string => {
        const baseUrl = "https://www.google.com/maps/place/";
        const path = location.replace(/\s/g, "+");
        return baseUrl + path;
    },
    sleep: (milliseconds: number): Promise<void> => {
        return new Promise((res, rej) => {
            setTimeout(() => {
                res();
            }, milliseconds);
        });
    },
};
