// A $server() function: callable from anywhere, including event handlers.
export const serverTime = $server(async () => new Date().toISOString());
