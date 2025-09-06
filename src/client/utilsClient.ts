import { actions } from "astro:actions";

export const utilsClient = {
    actions: async <T extends keyof typeof actions>(
        action: T,
        ...params: Parameters<(typeof actions)[T]>
    ): Promise<ReturnType<(typeof actions)[T]> | undefined> => {
        console.log(action, params[0]);
        const { data, error } = await actions[action](params[0] as any);

        if (error) {
            console.log(`ACTION ERROR: ${error.message}`);
            return undefined;
        }

        return data as ReturnType<(typeof actions)[T]>;
    },
};
