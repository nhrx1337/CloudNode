export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024;
export const TUS_CHUNK_SIZE = 16 * 1024 * 1024;
export const TUS_ENDPOINT = "/api/tus";
export const TUS_RETRY_DELAYS = [0, 1000, 3000, 5000, 10000, 20000, 30000];
