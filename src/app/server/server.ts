//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import express from 'express';
import { initExpress } from '@remult/server';
import fs from 'fs';
import { serverInit } from './server-init';
import '../app.module';
import csrf from "csurf";


import { ServerSignIn } from "../users/server-sign-in";
import { JWTCookieAuthorizationHelper } from '@remult/server';
import { ServerEvents } from './server-events';
import { Families, FamilyMemberBackground, FamilyMembers, FamilyTools } from '../families/families';
import { ServerContext } from '@remult/core';
import { Roles } from '../users/roles';
import { getInfo } from '../families/current-user-info';
import session from 'cookie-session'

serverInit().then(async (dataSource) => {

    let app = express();
    app.use('/api', session({ secret: process.env.TOKEN_SIGN_KEY || 'my secret' }))
    app.use('/api', (req, res, next) => {
        //disable csrf for the `validateToken` backend method that is the first call of the web site.
        const currentUserMethodName: keyof typeof ServerSignIn = 'validateToken';
        if (req.path === '/' + currentUserMethodName)
            csrf({ ignoreMethods: ["post"] })(req, res, next);
        else
            csrf({})(req, res, next);
    });
    app.use("/api", (req, res, next) => {
        res.cookie("XSRF-TOKEN", req.csrfToken());
        next();
    });

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
    eb.preProcessRequestAndReturnTrueToAuthorize = [x => {
        //@ts-ignore
        x.user = x.r.session['user']
        return !!x.user;
    }]
    let area = eb.addArea('/api/images');
    app.get('/api/images/:id', (req, res) => {
        area.process(async (r1, res1) => {
            let c = new ServerContext(dataSource);
            c.setReq(r1);
            let s = await c.for(FamilyMemberBackground).findId(req.params.id);
            if (!s) {
                res.sendStatus(404);
                return;
            }
            let mem = await c.for(FamilyMembers).findId(s.familyMember);
            if (c.isAllowed(Roles.child) && s.familyMember.value == c.user.id ||
                c.isAllowed(Roles.parent) && getInfo(c).familyId == mem.family.value) {


                let split = s.backgroundStorage.value.split(',');
                let type = split[0].substring(5).replace(';base64', '');

                res.contentType(type);

                res.send(Buffer.from(split[1], 'base64'));
            } else {
                res.sendStatus(401);
            }


        })(req, res);



    });

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