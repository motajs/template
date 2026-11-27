import { ILoadTaskRequest, ILoadTaskStarter } from './types';

export class WebLoadStarter implements ILoadTaskStarter {
    start(request: ILoadTaskRequest): Promise<Response> {
        return fetch(request.url, {
            method: request.method,
            body: request.body,
            headers: request.headers
        });
    }
}
