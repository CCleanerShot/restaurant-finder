export const utils = {
    betterEntries: <T extends Record<string, any>>(obj: T) => {
        type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];
        return Object.entries(obj) as Entries<T>;
    },
    betterKeys: <T extends Record<string, any>>(obj: T) => {
        type Keys<T> = (keyof T)[];
        return Object.keys(obj) as any as Keys<T>;
    },
    phoneNumberStringToNumber: (phoneNumber: string) => {
        const result = phoneNumber.match(/\d+/g);
        return result?.join("") ?? "";
    },
    metersToCoord: (meters: number) => {
        return meters / 111000;
    },
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
