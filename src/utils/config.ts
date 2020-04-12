import * as dotenv from "dotenv";

dotenv.config();
let path;
switch (process.env.NODE_ENV) {
  case "modern":
    path = `${__dirname}/../../config/env.modern`;
    break;
  case "casualModern":
    path = `${__dirname}/../../config/env.casualModern`;
    break;
  default:
    path = `${__dirname}/../../config/env.localhost`;
}
dotenv.config({ path });

export const APP_ID = process.env.APP_ID;
export const LOG_LEVEL = process.env.LOG_LEVEL;
