export declare type TestServer = {
    close(): Promise<void>;
};
export default function createTestServer(host: string, port: number, log?: boolean): Promise<TestServer>;
