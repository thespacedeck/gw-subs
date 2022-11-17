import { GraphQLClient } from "graphql-request";

export const graphClient = (endpoint: string) => {
  return new GraphQLClient(endpoint);
};
