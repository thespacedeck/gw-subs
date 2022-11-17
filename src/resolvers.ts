import { GooglePubSub } from "./datasources/pubsubAsyncIterator";
import { PubSub } from "@google-cloud/pubsub";

const commonMessageHandler = (data: any) => {
	return data.attributes;
};

export const resolvers = {
	Query: {
		subscriptionList() {
			return [];
		},
	},
	Subscription: {
		progressData: {
			// The client may request `Post` fields that are not resolvable from the
			// payload data that was included in `pubsub.publish()`, so we must
			// provide some mechanism to fetch those additional fields when requested
			resolve(payload: any, args: any, context: any, info: any) {
				return payload;
			},
			async subscribe(_: any, args: any) {
				let googlePubSub = new GooglePubSub(
					{
						projectId: process.env.GCP_PROJECT_ID,
						credentials: {
							client_email: process.env.GCP_PROJECT_KEY_EMAIL,
							private_key: process.env.GCP_PROJECT_KEY,
						},
					},
					() => `${args.propId}-${args.deviceId}`,
					{
						filter: `attributes.propId = "${args.propId}-${args.deviceId}"`,
					},
					commonMessageHandler
				);
				return googlePubSub.asyncIterator(`progress`);
			},
		},
	},
};

// ###########################
// FOR TESTING THE SUBS
// ###########################
const pubsubPOST = new PubSub({
	projectId: process.env.GCP_PROJECT_ID,
	keyFilename: "./src/common/config/keyfile.json",
});

let ticker = 0;
const json = {
	status: "PROCESSING",
	propId: "SUBS-ID-222",
	ticker: "",
};
const json2 = {
	status: "PROCESSING",
	propId: "SUBS-ID-222-xxx",
	ticker: "",
};

setInterval(() => {
	ticker++;
	json.ticker = String(ticker);
	json2.ticker = String(ticker);

	pubsubPOST.topic("progress").publishMessage(
		{
			attributes: json,
		},
		(mes: any) => {
			// console.log("published json1", ticker);
		}
	);

	pubsubPOST.topic("progress").publishMessage(
		{
			attributes: json2,
		},
		(mes: any) => {
			// console.log("published json2", ticker);
		}
	);
}, 2000);
