import DDCSServer from "./server";

const server = new DDCSServer();
server.start(process.env.NODE_ENV === "development" ? 3000 : 8000);
