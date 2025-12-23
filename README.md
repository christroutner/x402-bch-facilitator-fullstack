# x402-bch Facilitator Demo

This directory contains the reference **Facilitator** service for the Bitcoin Cash adaptation of the x402 protocol. The facilitator (`bch-facilitator.js`) provides the `/facilitator` REST endpoints that Servers call to verify BCH payments and maintain prepaid UTXO balances, as described in the core [x402 specification](../../specs/x402-specification.md) and the BCH-focused [x402-bch specification v2.1](../../specs/x402-bch-specification-v2.1.md).

**Protocol Version**: This facilitator supports x402-bch v2 protocol with backward compatibility for v1 requests.

## Where the Facilitator Fits
- **Clients** broadcast BCH funding transactions and attach signed payment payloads to HTTP retries.
- **Servers** price their resources, issue HTTP `402` responses, and forward the client’s payment payload plus requirements to the Facilitator.
- **Facilitators** (this project) validate signatures, inspect UTXOs on-chain, track debit balances in LevelDB, and report whether a request can proceed.

This example implements the Facilitator role. It exposes the canonical `/facilitator/supported`, `/facilitator/verify`, and `/facilitator/settle` endpoints so Servers can outsource BCH-specific validation while still receiving funds directly on-chain.

## Features
- Implements the BCH `utxo` scheme defined in the specification, including signature checks and UTXO-based debit tracking.
- Uses [`minimal-slp-wallet`](https://www.npmjs.com/package/minimal-slp-wallet) plus a retry queue to query BCH infrastructure and validate funding transactions.
- Persists prepaid balances in LevelDB, enabling multiple paid requests against a single UTXO until depleted.
- Built with Clean Architecture boundaries: Adapters (wallet, logging, storage), Use Cases (verification/settlement), and REST Controllers (Express).

## Prerequisites
- Node.js 20 LTS or newer.
- npm 9+ (ships with Node 20).
- Access to BCH node infrastructure compatible with `minimal-slp-wallet`:
  - `consumer-api` (ipfs-bch-wallet-service), or
  - `rest-api` (bch-api, required for Double Spend Proof support).
- A BCH cash address controlled by the resource server to receive funds.

## Installation
```bash
cd x402/x402-bch/examples/facilitator
npm install
```

## Configuration
Copy `.env-local` to `.env` and adjust as needed. Key variables:

- `PORT`: HTTP port for the facilitator (default `4345`).
- `SERVER_BCH_ADDRESS`: Cash address that must receive the funding UTXO.
- `API_TYPE`: BCH backend interface (`consumer-api` or `rest-api`).
- `BCH_SERVER_URL`: URL for the BCH infrastructure node or consumer service.
- `LOG_LEVEL`: Logging verbosity (`info`, `debug`, etc.).

Example:
```bash
cp .env-local .env
```
Then edit `.env` to point at your BCH infrastructure and server address.

## Running the Facilitator
```bash
npm start
```

The service starts an Express server (see `bin/server.js`) and exposes:

- `GET /health` – simple health probe.
- `GET /` – welcome payload listing supported facilitator endpoints.
- `GET /facilitator/supported` – announces supported payment kinds in v2 format with `x402Version: 2`, `scheme: 'utxo'`, CAIP-2 network identifiers, extensions, and signers.
- `POST /facilitator/verify` – validates a BCH payment payload against advertised requirements, updates the ledger, and returns `{ isValid, payer, invalidReason?, remainingBalanceSat?, ledgerEntry? }`.
- `POST /facilitator/settle` – optional reconciliation step that replays `verify` and returns settlement metadata with CAIP-2 network format.

Logs include every incoming request plus wallet validation details. LevelDB state is stored in `./leveldb/utxo`.

## How Verification Works
1. **Schema checks** ensure the request matches the `utxo` scheme and BCH network (supports both v1 `'bch'` format and v2 CAIP-2 format `'bip122:000000000000000000651ef99cb9fcbe'`).
2. **Signature verification** reconstitutes `JSON.stringify(authorization)` and calls `BitcoinCash.verifyMessage`.
3. **UTXO inspection** fetches the funding transaction, verifies it paid `SERVER_BCH_ADDRESS`, and computes the satoshi value.
4. **Ledger updates** subtract the debit amount (supports both v1 `minAmountRequired` and v2 `amount` fields) from the stored balance, rejecting if insufficient to cover the call.

This mirrors the flow in the [x402-bch specification v2.1](../../specs/x402-bch-specification-v2.1.md) and allows a single on-chain payment to authorize multiple paid HTTP requests.

## Protocol Version Support

This facilitator supports **x402-bch v2** protocol with the following features:
- **CAIP-2 Network Identifiers**: Uses `bip122:000000000000000000651ef99cb9fcbe` for BCH mainnet (backward compatible with v1 `'bch'` format)
- **PaymentPayload Structure**: Supports v2 structure with `accepted` field (backward compatible with v1 top-level `scheme`/`network`)
- **Field Names**: Supports both v2 `amount` field and v1 `minAmountRequired` field
- **Response Format**: Returns v2 format with optional `remainingBalanceSat` and `ledgerEntry` fields

The facilitator automatically detects and handles both v1 and v2 request formats, ensuring seamless compatibility during migration periods.

## Working with the Demo Server & Client
- Run the Facilitator alongside the example [resource server](../server/) and [client](../client/). The server will POST to `/facilitator/verify` before returning protected data, and the client will automatically retry with BCH payment headers.
- Adjust `PAYMENT_AMOUNT_SATS` and pricing in the server example to observe the ledger decrementing remaining satoshis.

## Troubleshooting
- **`insufficient_utxo_balance`**: Fund a new UTXO or lower the cost per request.
- **Signature errors**: Ensure the client signs with the private key that owns the funding transaction.
- **UTXO not found**: Confirm your BCH backend is reachable.
- **Double-spend protections**: Switch `API_TYPE` to `rest-api` (bch-api) for Double Spend Proof support.

## Next Steps
- Integrate double spend proofs when connected to bch-api back ends.
- The `/facilitator/verify` endpoint now returns ledger snapshots (`remainingBalanceSat`, `ledgerEntry`) as per v2 specification.
- Combine with additional transports or marketplaces exposed via the Discovery API to build full x402-bch deployments.

## Example Request/Response (v2 format)

### GET /facilitator/supported
```json
{
  "kinds": [
    {
      "x402Version": 2,
      "scheme": "utxo",
      "network": "bip122:000000000000000000651ef99cb9fcbe"
    }
  ],
  "extensions": [],
  "signers": {
    "bip122:*": []
  }
}
```

### POST /facilitator/verify
**Request:**
```json
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "accepted": {
      "scheme": "utxo",
      "network": "bip122:000000000000000000651ef99cb9fcbe",
      "amount": "1000",
      "payTo": "bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d"
    },
    "payload": {
      "signature": "...",
      "authorization": {
        "from": "bitcoincash:qz9s2mccqamzppfq708cyfde5ejgmsr9hy7r3unmkk",
        "to": "bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d",
        "value": "1000",
        "txid": "...",
        "vout": 0,
        "amount": "2000"
      }
    }
  },
  "paymentRequirements": {
    "scheme": "utxo",
    "network": "bip122:000000000000000000651ef99cb9fcbe",
    "amount": "1000",
    "payTo": "bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d"
  }
}
```

**Response:**
```json
{
  "isValid": true,
  "payer": "bitcoincash:qz9s2mccqamzppfq708cyfde5ejgmsr9hy7r3unmkk",
  "remainingBalanceSat": "9000",
  "ledgerEntry": {
    "utxoId": "txid:0",
    "transactionValueSat": "20000",
    "totalDebitedSat": "11000",
    "lastUpdated": "2025-11-08T17:05:42.000Z"
  }
}
```