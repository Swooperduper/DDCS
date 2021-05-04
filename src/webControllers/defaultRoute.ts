import { OK, BAD_REQUEST } from "http-status-codes";
import { Controller, Get } from "@overnightjs/core";
import { Logger } from "@overnightjs/logger";
import { Request, Response } from "express";

@Controller("/")
export class DefaultController {
    @Get()
    private parse(req: Request, res: Response) {
        try {
            return res.status(OK).sendFile("assets/views/index.html", { root: __dirname });
        } catch (err) {
            Logger.Err(err, true);
            return res.status(BAD_REQUEST).json({
                error: err.message
            });
        }
    }
}
