import { Context, UserInfo } from '@remult/core';

export interface CurrentUserInfo  extends UserInfo{
    familyId:string,
    familyName:string
}
export function getInfo(context:Context){
    return <CurrentUserInfo>context.user;
    
}