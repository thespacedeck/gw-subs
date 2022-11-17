# Subscriptions in Apollo Server v4

This example demonstrates a basic subscription operation in Apollo Server. [See the docs on subscriptions](https://www.apollographql.com/docs/apollo-server/data/subscriptions/)

The example server exposes one subscription (`progressData`) that returns an object:

```ts
{
	status: String;
	propId: String;
	ticker: String;
}
```

After you start up this server, you can test out running a subscription with the Apollo Studio Explorer by following the link from http://localhost:4000/graphql to the Apollo Sandbox. You might need to edit the Apollo Sandbox connection settings to select the [`graphql-ws` subscriptions implementation](https://www.apollographql.com/docs/studio/explorer/additional-features/#subscription-support). You'll see the subscription's payload property `ticker` value update every second.

```graphql
subscription progressData($propId: ID!, $deviceId: String!) {
	progressData(propId: $propId, deviceId: $deviceId) {
		status
		propId
		ticker
	}
}
```

## Run locally

```shell
npm install
npm run dev
```
