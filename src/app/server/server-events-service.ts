import { Injectable, NgZone } from '@angular/core';
import { BusyService, JwtSessionManager } from '@remult/angular';
import { ServerFunction, Context } from '@remult/core';
import { Subject } from 'rxjs';

@Injectable()
export class ServerEventsService {

    constructor(public zone: NgZone, private busy: BusyService, private tokenHelper: JwtSessionManager, private context: Context) {

        this.refreshEventListener();
        tokenHelper.tokenInfoChanged = () => {
            this.refreshEventListener();

        };

    }
    private familyInfoChangedSubject = new Subject();
    onFamilyInfoChangedSubject(whatToDo: () => Promise<void>, destroyHelper: DestroyHelper) {
        let y = this.familyInfoChangedSubject.subscribe(() => {
            this.busy.donotWait(whatToDo);

        });
        destroyHelper.add(() => y.unsubscribe());

    }
    eventSource: any;/*EventSource*/
    private refreshEventListener() {
        if (typeof (window) !== 'undefined') {
            let EventSource: any = window['EventSource'];
            if (this.context.isSignedIn() && typeof (EventSource) !== "undefined") {
                this.zone.run(() => {
                    var source = new EventSource(Context.apiBaseUrl + '/' + 'stream', { withCredentials: true });
                    if (this.eventSource) {
                        this.eventSource.close();
                        this.eventSource = undefined;
                    }
                    this.eventSource = source;
                    source.onmessage = e => {

                        this.zone.run(() => {
                            this.familyInfoChangedSubject.next();
                        });
                    };
                    let x = this;
                    source.addEventListener("authenticate", async function (e) {
                        await x.busy.donotWait(async () => await ServerEventsService.DoAthorize((<any>e).data.toString()));

                    });
                });
            }
            else if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = undefined;
            }
        }
    }

    @ServerFunction({ allowed: c => c.isSignedIn() })
    static DoAthorize(key: string, context?: Context) {
        ServerEventsService.authorize(key, context);
    }

    static authorize: (key: string, context: Context) => void = (key: string) => { };
}


export class DestroyHelper {
    private destroyList: (() => void)[] = [];
    add(arg0: () => void) {
        this.destroyList.push(arg0);
    }
    destroy() {
        for (const d of this.destroyList) {
            d();
        }
    }

}