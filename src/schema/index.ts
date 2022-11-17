import gql from "graphql-tag";

export const typeDefs = gql`
	schema {
		query: Query
		subscription: Subscription
	}

	type Query {
		subscriptionList: [String]
	}

	type Subscription {
		progressData(propId: ID!, deviceId: String!): progressData
	}

	type progressData {
		status: String
		propId: String
		ticker: String
	}
`;
