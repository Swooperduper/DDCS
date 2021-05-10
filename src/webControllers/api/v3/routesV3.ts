import * as _ from "lodash";
import * as serverCodes from "http-status-codes";
import { Controller, Get } from "@overnightjs/core";
import { Logger } from "@overnightjs/logger";
import { Request, Response } from "express";
import * as ddcsController from "../../../controllers";
import * as localModels from "../../../controllers/db/local/models";

@Controller("api/v3")
export class V3Controller {
    @Get("userAccounts")
    private userAccounts(req: Request, res: Response) {
        try {
            ddcsController.userAccountActionsRead({})
                .then((resp) => {
                    const cleanAccounts: any[] = [];
                    resp.forEach((account) => {
                        cleanAccounts.push({
                            _id: account._id,
                            authId: account.authId,
                            locale: account.locale,
                            nickName: account.nickName,
                            curSocket: account.curSocket,
                            gameName: account.gameName,
                            ucid: account.ucid,
                            lastServer: account.lastServer,
                            lastIp: account.lastIp,
                            permLvl: account.permLvl
                        });
                    });
                    return res.status(serverCodes.OK).json(cleanAccounts);
                })
                .catch((err) => {
                    return res.status(serverCodes.BAD_REQUEST).json(err);
                })
            ;
        } catch (err) {
            Logger.Err(err, true);
            return res.status(serverCodes.BAD_REQUEST).json({error: err.message});
        }
    }
    @Get("servers")
    private servers(req: Request, res: Response) {
        try {
            ddcsController.serverActionsRead({enabled: true})
                .then((resp) => {
                    return res.status(serverCodes.OK).json(resp);
                })
                .catch((err) => {
                    return res.status(serverCodes.BAD_REQUEST).json(err);
                })
            ;
        } catch (err) {
            Logger.Err(err, true);
            return res.status(serverCodes.BAD_REQUEST).json({error: err.message});
        }
    }
    @Get("theaters")
    private theaters(req: Request, res: Response) {
        try {
            ddcsController.theaterActionsRead()
                .then((resp) => {
                return res.status(serverCodes.OK).json(resp);
            })
                .catch((err) => {
                    return res.status(serverCodes.BAD_REQUEST).json(err);
                })
            ;
        } catch (err) {
            Logger.Err(err, true);
            return res.status(serverCodes.BAD_REQUEST).json({error: err.message});
        }
    }
    @Get("bases/:serverName")
    private bases(req: Request, res: Response) {
        try {
            if (req.params.servername !== "") {
                ddcsController.serverActionsRead({_id: req.params.serverName})
                    .then((curServer) => {
                        ddcsController.getDbConnection(
                            curServer[0].ip,
                            curServer[0]._id,
                            process.env.DB_USER,
                            process.env.DB_PASSWORD
                        )
                            .then((dbConnection) => {
                                ddcsController.updateDBModels(dbConnection, localModels);
                                ddcsController.baseActionRead({})
                                    .then((resp) => {
                                        return res.status(serverCodes.OK).json(resp);
                                    })
                                    .catch((err) => {
                                        return res.status(serverCodes.BAD_REQUEST).json(err);
                                    })
                                ;
                            })
                            .catch((err) => {
                                return res.status(serverCodes.BAD_REQUEST).json(err);
                            })
                        ;
                    })
                    .catch((err) => {
                        return res.status(serverCodes.BAD_REQUEST).json(err);
                    })
                ;
            }
        } catch (err) {
            Logger.Err(err, true);
            return res.status(serverCodes.BAD_REQUEST).json({error: err.message});
        }
    }
    @Get("unitStatics/:serverName")
    private unitStatics(req: Request, res: Response) {
        try {
            if (req.params.servername !== "") {
                ddcsController.serverActionsRead({_id: req.params.serverName})
                    .then((curServer) => {
                        ddcsController.getDbConnection(
                            curServer[0].ip,
                            curServer[0]._id,
                            process.env.DB_USER,
                            process.env.DB_PASSWORD
                        )
                            .then((dbConnection) => {
                                return res.status(serverCodes.OK).json([]);
                            })
                            .catch((err) => {
                                return res.status(serverCodes.BAD_REQUEST).json(err);
                            })
                        ;
                    })
                    .catch((err) => {
                        return res.status(serverCodes.BAD_REQUEST).json(err);
                    })
                ;
            }
        } catch (err) {
            Logger.Err(err, true);
            return res.status(serverCodes.BAD_REQUEST).json({error: err.message});
        }
    }
}
