// Server functions: the body only runs on the server. During server rendering
// it's a direct call; in the browser the same call is a request to the server.
let count = 0;

export const getCount = $server(async () => count);

export const increment = $server(async () => ++count);
