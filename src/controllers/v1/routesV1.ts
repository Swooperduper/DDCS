import { OK, BAD_REQUEST } from 'http-status-codes';
import { Controller, Post } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { Request, Response } from 'express';

@Controller('api/v1')
export class V1Controller {
    @Post('parse')
    private parse(req: Request, res: Response) {
        interface ResponseBody {
            statusCode: number,
            data: {
                firstName: string,
                lastName: string,
                clientId: string
            }
        }

        try {
            let dataString: string = req.body.data;
            let responseObject: ResponseBody = {
                statusCode: 200,
                data: {
                    firstName: dataString.substring(0,8),
                    lastName: dataString.substring(8,18),
                    clientId: dataString.substring(18,25)
                }
            };

            return res.status(OK).json(responseObject);
        } catch (err) {
            Logger.Err(err, true);
            return res.status(BAD_REQUEST).json({
                error: err.message,
            });
        }
    }
}