export interface IRagWorkerRequest {
    type: 'INIT' | 'INDEX' | 'QUERY';
    payload: any;
}

export interface IRagWorkerResponse {
    type: 'INIT_DONE' | 'INDEX_PROGRESS' | 'INDEX_DONE' | 'QUERY_RESULT' | 'ERROR';
    payload: any;
}

export interface InitPayload {
    modelName?: string;
}

export interface IndexPayload {
    messages: { content: string; sender: string; timestamp: Date }[];
}

export interface QueryPayload {
    text: string;
    k?: number;
}
