export type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export const sessionState = $state({
    sessionId: crypto.randomUUID(),
    messages: [] as Message[],
});

