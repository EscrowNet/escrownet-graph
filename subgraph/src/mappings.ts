import { Protobuf } from "as-proto/assembly";
import { Events as protoEvents } from "./pb/starknet/v1/Events";
import {
  DepositorApproved,
  ArbiterApproved,
  EscrowInitialized,
  EscrowRefunded,
  EscrowFunded,
  FundsReleased
} from "../generated/schema";
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { JSON } from "assemblyscript-json";

// Helper function to generate a unique ID from transaction hash and event index
function generateEventId(txHash: Bytes, eventIndex: number): Bytes {
  const idStr = txHash.toHexString() + "-" + eventIndex.toString();
  return Bytes.fromUTF8(idStr);
}

// Helper functions to parse JSON safely
function getJSONStr(jsonValue: JSON.Value, key: string): string | null {
  if (!(jsonValue instanceof JSON.Obj)) return null;
  const jsonObj = jsonValue as JSON.Obj;
  const value = jsonObj.get(key);
  if (!value) return null;
  return value.stringify();
}

function getJSONBigInt(jsonValue: JSON.Value, key: string): BigInt | null {
  const str = getJSONStr(jsonValue, key);
  return str ? BigInt.fromString(str) : null;
}

function getJSONBytes(jsonValue: JSON.Value, key: string): Bytes | null {
  const str = getJSONStr(jsonValue, key);
  return str ? Bytes.fromHexString(str) : null;
}

export function handleTriggers(bytes: Uint8Array): void {
  const input = Protobuf.decode<protoEvents>(bytes, protoEvents.decode);
  const events = input.events;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const jsonStr = event.jsonDescription;

    // Parse JSON description
    let jsonValue: JSON.Value;
    if (!jsonStr || jsonStr === "") {
      log.warning("Empty JSON string at index {}", [i.toString()]);
      continue;
    }
    jsonValue = JSON.parse(jsonStr);

    if (!(jsonValue instanceof JSON.Obj)) {
      log.warning("JSON is not an object for event at index {}: {}", [i.toString(), jsonStr]);
      continue;
    }

    // Extract common fields
    const eventType = getJSONStr(jsonValue, "eventType");
    const blockTimestamp = getJSONBigInt(jsonValue, "block_timestamp");
    const blockNumber = getJSONBigInt(jsonValue, "block_number");
    const transactionHash = getJSONBytes(jsonValue, "transaction_hash");

    if (!eventType || !blockTimestamp || !blockNumber || !transactionHash) {
      log.warning("Missing required fields in event at index {}: {}", [i.toString(), jsonStr]);
      continue;
    }

    // Generate unique ID
    const id = generateEventId(transactionHash, i);

    // Handle specific event types
    if (eventType == "DepositorApproved") {
      const depositor = getJSONBytes(jsonValue, "depositor");
      const escrowId = getJSONBigInt(jsonValue, "escrow_id");
      const timeOfApproval = getJSONBigInt(jsonValue, "time_of_approval");

      if (!depositor || !escrowId || !timeOfApproval) {
        log.warning("Missing DepositorApproved fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new DepositorApproved(id.toHexString());
      entity.depositor = depositor;
      entity.escrowId = escrowId;
      entity.timeOfApproval = timeOfApproval;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();

    } else if (eventType == "ArbiterApproved") {
      const arbiter = getJSONBytes(jsonValue, "arbiter");
      const escrowId = getJSONBigInt(jsonValue, "escrow_id");
      const timeOfApproval = getJSONBigInt(jsonValue, "time_of_approval");

      if (!arbiter || !escrowId || !timeOfApproval) {
        log.warning("Missing ArbiterApproved fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new ArbiterApproved(id.toHexString());
      entity.arbiter = arbiter;
      entity.escrowId = escrowId;
      entity.timeOfApproval = timeOfApproval;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();

    } else if (eventType == "EscrowInitialized") {
      const escrowId = getJSONBigInt(jsonValue, "escrow_id");
      const beneficiary = getJSONBytes(jsonValue, "beneficiary");
      const provider = getJSONBytes(jsonValue, "provider");
      const amount = getJSONBigInt(jsonValue, "amount");
      const timestamp = getJSONBigInt(jsonValue, "timestamp");

      if (!escrowId || !beneficiary || !provider || !amount || !timestamp) {
        log.warning("Missing EscrowInitialized fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new EscrowInitialized(id.toHexString());
      entity.escrowId = escrowId;
      entity.beneficiary = beneficiary;
      entity.provider = provider;
      entity.amount = amount;
      entity.timestamp = timestamp;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();

    } else if (eventType == "EscrowRefunded") {
      const escrowId = getJSONBigInt(jsonValue, "escrow_id");
      const depositor = getJSONBytes(jsonValue, "depositor");
      const amount = getJSONBigInt(jsonValue, "amount");
      const timestamp = getJSONBigInt(jsonValue, "timestamp");

      if (!escrowId || !depositor || !amount || !timestamp) {
        log.warning("Missing EscrowRefunded fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new EscrowRefunded(id.toHexString());
      entity.escrowId = escrowId;
      entity.depositor = depositor;
      entity.amount = amount;
      entity.timestamp = timestamp;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();

    } else if (eventType == "EscrowFunded") {
      const depositor = getJSONBytes(jsonValue, "depositor");
      const amount = getJSONBigInt(jsonValue, "amount");
      const escrowAddress = getJSONBytes(jsonValue, "escrow_address");

      if (!depositor || !amount || !escrowAddress) {
        log.warning("Missing EscrowFunded fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new EscrowFunded(id.toHexString());
      entity.depositor = depositor;
      entity.amount = amount;
      entity.escrowAddress = escrowAddress;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();

    } else if (eventType == "FundsReleased") {
      const escrowId = getJSONBigInt(jsonValue, "escrow_id");
      const beneficiary = getJSONBytes(jsonValue, "beneficiary");
      const amount = getJSONBigInt(jsonValue, "amount");

      if (!escrowId || !beneficiary || !amount) {
        log.warning("Missing FundsReleased fields at index {}: {}", [i.toString(), jsonStr]);
        continue;
      }

      let entity = new FundsReleased(id.toHexString());
      entity.escrowId = escrowId;
      entity.beneficiary = beneficiary;
      entity.amount = amount;
      entity.blockNumber = blockNumber;
      entity.blockTimestamp = blockTimestamp;
      entity.transactionHash = transactionHash;
      entity.save();
    }
  }
}