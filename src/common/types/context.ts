import { PubSub } from "@google-cloud/pubsub";
export interface CustomDataSources {}

export interface CustomContext {
	pubsub: PubSub;
}

export type ResolverContext = CustomContext & {
	dataSources: CustomDataSources;
};
