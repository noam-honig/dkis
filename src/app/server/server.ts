//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { serverInit } from './server-init';
import '../app.module';


import { ServerSignIn } from "../users/server-sign-in";
import { JWTCookieAuthorizationHelper } from '@remult/server';
import { ServerEvents } from './server-events';
import { Families, FamilyTools } from '../families/families';

serverInit().then(async (dataSource) => {

    let app = express();
    let serverEvents = new ServerEvents(app);
    let eb = initExpress(app, dataSource, process.env.DISABLE_HTTPS == "true");
    let lastMessage = new Date();
    FamilyTools.SendMessageToBrowsersImplementation = (family, message) => {
        if (new Date().valueOf() - lastMessage.valueOf() > 1000) {
            lastMessage = new Date();
            serverEvents.SendMessage(family, message)
        }
    };
    ServerSignIn.helper = new JWTCookieAuthorizationHelper(eb, process.env.TOKEN_SIGN_KEY);

    app.use(express.static('dist/dkis'));

    app.use('/*', async (req, res) => {

        const index = 'dist/dkis/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);

        }
    });

    let port = process.env.PORT || 3000;
    app.listen(port);
});