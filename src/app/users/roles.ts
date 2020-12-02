import { SignedInGuard } from '@remult/angular';
import { Injectable } from '@angular/core';



export const Roles = {  
    admin: 'admin',
    parent:'parent',
    familyInfo:'familyInfo',
    child:'child'
}


@Injectable()
export class AdminGuard extends SignedInGuard {

    isAllowed() {
        return Roles.admin;
    }
}