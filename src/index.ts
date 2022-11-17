import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import bodyParser from "body-parser";
import cors from "cors";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
const { PubSub } = require("@google-cloud/pubsub");

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
	server: httpServer,
	path: "/graphql",
});
const serverCleanup = useServer(
	{
		schema,
		onDisconnect: async (_ctx: any, msg: any) => {
			const pubSubClient = new PubSub({
				projectId: process.env.GCP_PROJECT_ID,
				keyFilename: "./src/common/config/keyfile.json",
			});

			console.log("onDisconnect");

			const sub = await pubSubClient.subscription(`SUBS-ID-222`);
			const [exists] = await sub.exists();
			if (exists) {
				console.log("exist: deleting subs");
				await pubSubClient.subscription(`SUBS-ID-222`).delete();
			} else {
				console.log("subs does not exist");
			}
		},
	},
	wsServer
);

const gateway = new ApolloGateway({
	fetcher: require("make-fetch-happen").defaults({
		onRetry() {
			console.log("Retrying to get valid schema!");
		},
	}),
	buildService({ name, url }: any) {
		return new RemoteGraphQLDataSource({
			url,
			willSendRequest({ request, context }: any) {
				request.http.headers.set(
					"user",
					context.user ? JSON.stringify(context.user) : null
				);
				request.http.headers.set(
					"original-header",
					context.header ? JSON.stringify(context.header) : null
				);
			},
		});
	},
});

const server = new ApolloServer({
	gateway,
	introspection: Boolean(process.env.APOLLO_INTROSPECTION),
	persistedQueries: {
		ttl: 900, // 15 minutes
	},
	plugins: [
		// Proper shutdown for the HTTP server.
		ApolloServerPluginDrainHttpServer({ httpServer }),

		// Proper shutdown for the WebSocket server.
		{
			async serverWillStart() {
				return {
					async drainServer() {
						await serverCleanup.dispose();
					},
				};
			},
		},
	],
});

(async () => {
	await server.start();
	app.use(
		"/graphql",
		cors<cors.CorsRequest>(),
		bodyParser.json(),
		expressMiddleware(server)
	);

	// Now that our HTTP server is fully set up, actually listen.
	httpServer.listen(process.env.PORT, () => {
		console.log(
			`🚀 Query endpoint ready at http://localhost:${process.env.PORT}/graphql`
		);
		console.log(
			`🚀 Subscription endpoint ready at ws://localhost:${process.env.PORT}/graphql`
		);
	});
})();
