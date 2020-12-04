import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import * as passwordHash from 'password-hash';

import '../app.module';


import { Users } from '../users/users';
import { Entity, EntityClass, IdEntity, NumberColumn, ServerContext, SqlDatabase } from '@remult/core';
import { ConnectionOptions } from 'tls';
import { UpperCasePipe } from '@angular/common';
import { Accounts, Transactions } from '../accounts/accounts';


export async function serverInit() {

    config();
    let ssl: boolean | ConnectionOptions = {
        rejectUnauthorized: false
    };
    if (process.env.DISABLE_POSTGRES_SSL)
        ssl = false;

    if (process.env.logSqls) {
        SqlDatabase.LogToConsole = true;
    }

    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL environment variable found, if you are developing locally, please add a '.env' with DATABASE_URL='postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE*'");
    }
    let dbUrl = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: ssl
    });
    Users.passwordHelper = {
        generateHash: p => passwordHash.generate(p),
        verify: (p, h) => passwordHash.verify(p, h)
    }
    let result = new SqlDatabase(new PostgresDataProvider(pool));

    await new PostgresSchemaBuilder(result).verifyStructureOfAllEntities();
    let c = new ServerContext(result);

    let settings = await c.for(VersionStorage).findFirst();
    if (!settings) {
        settings = c.for(VersionStorage).create();
        settings.version.value = 0;
    }

    let version = async (ver: number, what: () => Promise<void>) => {
        if (settings.version.value < ver) {
            try {
                console.log('start version ', ver);
                await what();
                console.log('end version ', ver);
            } catch (err) {
                console.error("failed for version ", ver, err);
                throw err;
            }
            settings.version.value = ver;
            await settings.save();
        }
    }
    version(2, async () => {
        for (const acc of await c.for(Accounts).find()) {
            acc.balance.value = 0;
            for (const t of await c.for(Transactions).find({ where: t => t.account.isEqualTo(acc.id.value), orderBy: t => t.transactionTime })) {
                t.balance.value = t.type.value.applyAmountToAccount(t.amount.value, acc);
                await t.save();
            }
            await acc.save();
        }


    });

    return result;

}

@EntityClass
class VersionStorage extends IdEntity {
    version = new NumberColumn();
    constructor() {
        super({
            allowApiRead: false,
            name: 'version'
        })
    }
}