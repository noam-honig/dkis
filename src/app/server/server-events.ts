import { Express, Response } from 'express';
import { ServerEventsService } from './server-events-service'; 
import { Context, ServerContext } from '@remult/core';
import { ExpressRequestBridgeToDataApiRequest } from '@remult/server';
import { getInfo } from '../families/current-user-info';




let tempConnections: any = {};
ServerEventsService.authorize = (key, context) => {
    let x = tempConnections[key];
    if (x)
        x(context);
};
class userInFamily {
    write(message: string): void {
        this.response.write(message);
    }

    constructor(
        public response: Response) {

    }
}

export class ServerEvents {
    families = new Map<string, userInFamily[]>();

    constructor(private app: Express) {
        this.app.get('/api/stream', (req, res) => {
            //@ts-ignore
            let r = new ExpressRequestBridgeToDataApiRequest(req);
            let context = new ServerContext();
            context.setReq(r);
            res.writeHead(200, {
                "Access-Control-Allow-Origin": req.header('origin') ? req.header('origin') : '',
                "Access-Control-Allow-Credentials": "true",
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            let key = new Date().toISOString();
            let family: string;
            tempConnections[key] = (context: Context) => {
                if (context.isSignedIn()) {
                    family = getInfo(context).familyId;
                    let x = this.families.get(family);
                    if (!x) {
                        x = [];
                        this.families.set(family, x);
                    }
                    x.push(new userInFamily(res));
                }
                tempConnections[key] = undefined;

            };
            res.write("event:authenticate\ndata:" + key + "\n\n");

            req.on("close", () => {
                tempConnections[key] = undefined;
                if (family) {
                    let x = this.families.get(family);
                    if (x) {
                        let i = x.findIndex(x => x.response == res);
                        if (i >= 0)
                            x.splice(i, 1);
                    }
                }
            });
        });
    }

    SendMessage( family: string,message: string) {
        let z = this;
        setTimeout(() => {

            let y = z.families.get(family);
            if (y)
                y.forEach(y => y.write("data:" + message + "\n\n"));
        }, 250);

    }
}