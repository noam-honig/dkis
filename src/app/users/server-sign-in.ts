import { Roles } from './roles';
import { JWTCookieAuthorizationHelper } from '@remult/server';
import { ServerFunction } from '@remult/core';
import { UserInfo, Context } from '@remult/core';
import { Users } from './users';
export class ServerSignIn {
    static helper: JWTCookieAuthorizationHelper;
    @ServerFunction({ allowed: () => true })
    static async signIn(user: string, password: string, context?: Context) {
        let result: UserInfo;
        let u = await context.for(Users).findFirst(h => h.name.isEqualTo(user));
        if (u)
            if (!u.realStoredPassword.value || Users.passwordHelper.verify(password, u.realStoredPassword.value)) {
                result = {
                    id: u.id.value,
                    roles: [],
                    name: u.name.value
                };
                if (u.admin.value) {
                    result.roles.push(Roles.admin);
                }
            }

        if (result) {
            return this.setSessionUser(context, result);
        }
        return undefined;
    }
    @ServerFunction({ allowed: () => true })
    static async validateToken(context?: Context) {
        return context.user;
    }
    @ServerFunction({ allowed: c => c.isSignedIn() })
    static async signOut(context?: Context) {
        return ServerSignIn.setSessionUser(context, null);
    }

    static setSessionUser(context: Context, user: UserInfo | null) {
        //@ts-ignore
        context.req.r.session['user'] = user;
        //@ts-ignore
        context.req.r.sessionOptions.maxAge = 365 * 24 * 60 * 60 * 1000; //remember for a year
        return user;
    }
}
