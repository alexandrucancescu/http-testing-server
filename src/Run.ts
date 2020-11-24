import createTestServer from "./Server";



async function main(){
	const server = await createTestServer("localhost", 3099, true);
}

main();