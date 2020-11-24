import createTestServer from "./server";



async function main(){
	const server = await createTestServer("localhost", 3099, true);
}

main();