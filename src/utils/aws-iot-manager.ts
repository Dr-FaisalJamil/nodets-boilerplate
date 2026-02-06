/**
 * mqtt-example.ts
 * Focus: mqtt namespace (connect/subscribe/publish)
 * This example assumes you already have a built connection config.
 * In real usage, you'll build `config` with the `iot` namespace (see iot-example.js).
 */

// module imports
// import { mqtt, iot, io } from "aws-iot-device-sdk-v2";
import os from "os";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

//  file imports
import SocketManager from "./socket-manager";
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

// variable initializations

class AwsIotManager {
  private static instance: AwsIotManager;

  private readonly mqttClientId = requireEnv(
    ENVIRONMENT_VARIABLES.MQTT_CLIENT_ID,
  );
  private readonly awsIotEndpoint = requireEnv(
    ENVIRONMENT_VARIABLES.AWS_IOT_ENDPOINT,
  );
  private readonly awsIotCertPath = requireEnv(
    ENVIRONMENT_VARIABLES.AWS_IOT_CERT_PATH,
  );
  private readonly awsIotPrivateKeyPath = requireEnv(
    ENVIRONMENT_VARIABLES.AWS_IOT_PRIVATE_KEY_PATH,
  );
  private readonly mqttKeepAlive = requireEnv(
    ENVIRONMENT_VARIABLES.MQTT_KEEP_ALIVE,
  );

  private connection: /* mqtt.MqttClientConnection */ any = null;
  private connected = false;
  private subscriptions: /* <mqtt.MqttSubscribeRequest> */ any = new Map();
  // Auto-reconnection settings
  private autoReconnect = true;
  private reconnectAttempt = 0;
  private maxReconnectAttempts = 10; // Max attempts before giving up temporarily
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 60000; // Max 60 seconds between attempts
  private reconnectTimer: NodeJS.Timeout | null = null;
  private clientId: string = "";
  private messageHandlers: Map<
    string,
    (topic: string, payload: Uint8Array) => void
  > = new Map();
  private stats: {
    messagesReceived: number;
    messagesSent: number;
    connectionAttempts: number;
    lastActivity: Date | null;
    reconnectAttempts: number;
  } = {
    messagesReceived: 0,
    messagesSent: 0,
    connectionAttempts: 0,
    lastActivity: null,
    reconnectAttempts: 0,
  };

  constructor() {
    if (!AwsIotManager.instance) {
      AwsIotManager.instance = this;
    }
    this.initialize();
    return AwsIotManager.instance;
  }

  /**
   * Initializes the MQTT connection.
   */
  private async initialize() {
    // // 1) Bootstrap the low-level I/O (from `io`)
    // const clientBootstrap: io.ClientBootstrap = new io.ClientBootstrap();
    // // 2) Build a connection config (via `iot`); normally you’d keep this in a helper
    // const configBuilder: iot.AwsIotMqttConnectionConfigBuilder =
    //   iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(
    //     this.awsIotCertPath,
    //     this.awsIotPrivateKeyPath
    //   );
    // configBuilder.with_endpoint(this.awsIotEndpoint);
    // configBuilder.with_client_id(this.clientId);
    // configBuilder.with_keep_alive_seconds(parseInt(this.mqttKeepAlive || "30"));
    // // Use clean session to avoid conflicts with stale sessions
    // // Set to true to start fresh each time, false to resume previous session
    // configBuilder.with_clean_session(true);
    // const config: any = configBuilder.build();
    // // 3) mqtt: create client and connection
    // const client: mqtt.MqttClient = new mqtt.MqttClient(clientBootstrap);
    // this.connection = client.new_connection(config);
    // // 4) register lifecycle events (from mqtt connection)
    // this.connection.on("connect", () => {
    //   console.log("[mqtt] connected");
    //   this.connected = true;
    //   this.onConnectionSuccess();
    // });
    // this.connection.on("resume", () => {
    //   console.log("[mqtt] resumed");
    //   this.connected = true;
    // });
    // this.connection.on("disconnect", () => {
    //   console.log("[mqtt] disconnected");
    //   this.connected = false;
    //   this.onConnectionLost();
    // });
    // this.connection.on("error", (err: any) => {
    //   const errorMessage = err?.message || String(err);
    //   // Ignore "already connected" errors - they're not real errors
    //   if (
    //     errorMessage.includes("ALREADY_CONNECTED") ||
    //     errorMessage.includes("already connected") ||
    //     errorMessage.includes("Connection already established")
    //   ) {
    //     // Connection is actually fine, just update state if needed
    //     if (!this.connected) {
    //       this.connected = true;
    //     }
    //     return; // Don't log or trigger reconnection for this
    //   }
    //   // Log and handle real errors
    //   console.error("[mqtt] error:", errorMessage);
    //   this.connected = false;
    //   this.onConnectionLost();
    // });
  }

  /**
   * Establishes a connection to the MQTT broker.
   * @returns {Promise<boolean>} The connection status.
   */
  async connect(): Promise<boolean> {
    // Skip if already connected
    if (this.connected) {
      return true;
    }

    try {
      this.stats.connectionAttempts++;
      console.log(
        `[mqtt] Attempting to connect to ${this.awsIotEndpoint} with client ID: ${this.clientId}`,
      );
      const connection = true; // await this.connection.connect();
      this.connected = true;
      console.log(`[mqtt] connected to ${this.awsIotEndpoint}`);
      this.onConnectionSuccess();
      return connection;
    } catch (error: any) {
      // Handle "already connected" error gracefully
      const errorMessage = error?.message || String(error);
      if (
        errorMessage.includes("ALREADY_CONNECTED") ||
        errorMessage.includes("already connected") ||
        errorMessage.includes("Connection already established")
      ) {
        // Connection is actually established, just update our state
        this.connected = true;
        console.log(
          "[mqtt] Connection already established (detected from error)",
        );
        this.onConnectionSuccess();
        return true;
      }

      // For other errors, mark as disconnected and trigger reconnection
      this.connected = false;
      console.error(`[mqtt] Failed to connect: ${errorMessage}`, error);
      // Log additional debugging info only for real errors
      console.error(`[mqtt] Client ID: ${this.clientId}`);
      console.error(`[mqtt] Endpoint: ${this.awsIotEndpoint}`);
      console.error(
        `[mqtt] Cert Path: ${this.awsIotCertPath ? "Set" : "NOT SET"}`,
      );
      console.error(
        `[mqtt] Key Path: ${this.awsIotPrivateKeyPath ? "Set" : "NOT SET"}`,
      );
      this.onConnectionLost();
      throw error;
    }
  }

  /**
   * Subscribes to a MQTT topic.
   * @param {string} [topic="863251072671493/#"] The topic to subscribe to.
   * @returns {Promise<mqtt.Subscription>} The subscription object.
   */
  async subscribe(
    topic: string,
  ): Promise<any> /* <mqtt.MqttSubscribeRequest> */ {
    // if (!this.connection) {
    //   throw new Error(
    //     "MQTT connection not initialized. Call initialize() first."
    //   );
    // }
    // // Store the message handler for resubscription
    // const messageHandler = async (rcvTopic: string, payload: Uint8Array) => {
    //   try {
    //     const msg = await this.parseMQTTMessage(payload);
    //     console.log("[mqtt] rcv topic:", rcvTopic);
    //     console.log("[mqtt] message parsed:", msg);
    //     // const trackerIMEI = rcvTopic.split("/")[0];
    //     if (rcvTopic.includes("/data")) {
    //       if (msg?.RSP || msg?.state?.reported) {
    //         // Emit raw MQTT message to sockets
    //         SocketManager.emitGroupEvent({
    //           event: rcvTopic,
    //           data: { topic: rcvTopic, message: msg },
    //         });
    //       }
    //     }
    //   } catch (e) {
    //     console.log("[mqtt] raw payload:", e, rcvTopic, payload);
    //   }
    // };
    // // Store handler for resubscription
    // this.messageHandlers.set(topic, messageHandler);
    // try {
    //   const subscription = await this.connection.subscribe(
    //     topic,
    //     mqtt.QoS.AtMostOnce,
    //     messageHandler
    //   );
    //   this.subscriptions.set(topic, subscription);
    //   console.log(`[mqtt] subscribed to ${topic}`);
    //   return subscription;
    // } catch (error: any) {
    //   // Remove handler if subscription fails
    //   this.messageHandlers.delete(topic);
    //   console.error(
    //     `[mqtt] Failed to subscribe to ${topic}:`,
    //     error?.message || error
    //   );
    //   throw error;
    // }
  }

  /**
   * Parses a raw MQTT message payload into a JSON object.
   * Tries to parse the payload as a JSON string first, and if that fails, it falls back to parsing the string as a key-value pair format.
   * @param {Uint8Array} payload - The raw MQTT message payload.
   * @returns {Promise<any>} The parsed JSON object.
   */
  private async parseMQTTMessage(payload: Uint8Array): Promise<any> {
    let msg: any = Buffer.from(payload).toString();
    try {
      msg = JSON.parse(msg);
    } catch {
      msg = { RSP: msg };
    }
    return msg;
  }

  /**
   * Publishes a message to a MQTT topic.
   * @param {string} [topic="examples/mqtt/data"] The topic to publish to.
   * @param {string} [data=JSON.stringify({ hello: "world", ts: new Date().toISOString() })] The message to publish.
   * @returns {Promise<mqtt.MqttPublishRequest>} The publish request object.
   */
  async publish(
    topic = "863251072671493/data",
    data: any = { hello: "world", ts: new Date().toISOString() },
  ) {
    // const published = await this.connection.publish(
    //   topic,
    //   typeof data === "string" ? data : JSON.stringify(data),
    //   mqtt.QoS.AtMostOnce
    // );
    // console.log(`[mqtt] published message: ${data} to topic: ${topic}`);
    // return published;
  }

  /**
   * Disconnects from the MQTT broker.
   * @returns {Promise<mqtt.MqttDisconnectRequest>} The disconnection request object.
   */
  async disconnect() {
    const disconnection = true; // await this.connection.disconnect();
    console.log("[mqtt] disconnected cleanly");
    return disconnection;
  }

  /**
   * Save data to file (Phase 1 implementation)
   */
  private saveDataToFile(deviceId: string, data: any) {
    const timestamp = new Date().toISOString();
    const filename = `${deviceId}_${timestamp.replace(/[:.]/g, "-")}.json`;
    const dirpath = path.join(__dirname, "data");
    const filepath = path.join(dirpath, filename);

    const dataToSave = {
      deviceId,
      timestamp,
      receivedAt: new Date().toISOString(),
      data,
    };

    try {
      // Ensure the data directory exists (works for both src/ and compiled dist/)
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true });
      }

      fs.writeFileSync(filepath, JSON.stringify(dataToSave, null, 2));
      console.info(`💾 Data saved to: ${filename}`);
    } catch (err: any) {
      console.error(
        `❌ Failed to save telemetry data to file: ${err.message}`,
        err,
      );
    }
  }

  /**
   * Generate a unique MQTT client id per process so multiple instances
   * can stay connected simultaneously without kicking each other off.
   */
  private buildClientId() {
    const baseId = this.mqttClientId || "backend-boilerplate";
    const host = os
      .hostname()
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 16);
    const suffix = randomUUID().split("-")[0];
    const uniqueId = `${baseId}-${host}-${process.pid}-${suffix}`;
    // AWS IoT allows up to 128 chars for client id
    return uniqueId.slice(0, 128);
  }

  /**
   * Handle successful connection
   */
  private onConnectionSuccess() {
    // Reset reconnection settings on successful connection
    this.reconnectAttempt = 0;
    this.reconnectDelay = 1000;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Resubscribe to all topics
    this.resubscribeToTopics();
  }

  /**
   * Handle connection loss
   */
  private onConnectionLost() {
    // Only trigger reconnection if we're actually disconnected
    // and not already attempting to reconnect
    if (!this.connected && this.autoReconnect && !this.reconnectTimer) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.warn(
        `🌩️ ⚠️ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Will retry in ${this.maxReconnectDelay / 1000}s`,
      );

      // Reset attempt counter and try again after max delay
      this.reconnectAttempt = 0;
      this.reconnectTimer = setTimeout(() => {
        this.attemptReconnect();
      }, this.maxReconnectDelay);
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempt),
      this.maxReconnectDelay,
    );
    this.reconnectAttempt++;
    this.stats.reconnectAttempts++;

    console.info(
      `🌩️ 🔄 Scheduling reconnection attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts} in ${delay / 1000}s`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect() {
    this.reconnectTimer = null;

    if (this.connected) {
      console.info("🌩️ ✅ Already connected, skipping reconnection attempt");
      return;
    }

    try {
      console.info(
        `🌩️ 🔄 Attempting to reconnect... (attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts})`,
      );

      // Try to reconnect using existing connection
      if (this.connection) {
        try {
          await this.connection.connect();
          // If successful, the connect event handler will set this.connected = true
        } catch (connectError: any) {
          const errorMessage = connectError?.message || String(connectError);
          // Handle "already connected" error
          if (
            errorMessage.includes("ALREADY_CONNECTED") ||
            errorMessage.includes("already connected") ||
            errorMessage.includes("Connection already established")
          ) {
            this.connected = true;
            console.info(
              "🌩️ ✅ Connection already established during reconnect",
            );
            this.onConnectionSuccess();
            return;
          }

          // If connection fails with other error, try to reinitialize
          console.warn(
            `🌩️ ⚠️ Connection attempt failed, reinitializing: ${errorMessage}`,
          );
          await this.initialize();
          // Try connecting again after reinitialization
          await this.connection.connect();
        }
      } else {
        // Reinitialize if connection is null
        await this.initialize();
        await this.connection.connect();
      }

      // Note: connected flag is set by the event handler, not here
      console.info("🌩️ ✅ Reconnection successful!");
    } catch (error: any) {
      console.error(
        `🌩️ ❌ Reconnection attempt ${this.reconnectAttempt} failed:`,
        error?.message || error,
      );

      // Schedule next attempt
      if (this.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Resubscribe to all topics after reconnection
   */
  private async resubscribeToTopics() {
    if (this.messageHandlers.size === 0) {
      return;
    }

    console.info(
      `🌩️ 📡 Resubscribing to ${this.messageHandlers.size} topic(s)...`,
    );

    // Create a copy of handlers to avoid modification during iteration
    const topicsToResubscribe = new Map(this.messageHandlers);

    // Clear current subscriptions as they're no longer valid
    this.subscriptions.clear();

    for (const [topic, messageHandler] of topicsToResubscribe) {
      try {
        await this.subscribe(topic);
        console.info(`🌩️ ✅ Resubscribed to: ${topic}`);
      } catch (error: any) {
        console.error(
          `🌩️ ❌ Failed to resubscribe to ${topic}:`,
          error.message,
        );
      }
    }
  }
}

/**
 * Runs the AWS IoT example to demonstrate the MQTT client.
 * Connects to the MQTT broker, subscribes to a topic, publishes a message, and disconnects cleanly.
 * @returns {Promise<void>} The promise resolves when the example has completed.
 */
// export async function run(): Promise<void> {
//   console.log("*** AWS IoT MQTT Example Started ***");
//   const awsIotManager = new AwsIotManager();
//   await awsIotManager.connect();
//   await awsIotManager.subscribe();
//   await awsIotManager.publish();
//   await awsIotManager.disconnect();
// }

// Singleton instance to prevent multiple connections
// let awsIotManagerInstance: AwsIotManager | null = null;

/**
 * Get or create the singleton AWS IoT Manager instance
 * This ensures only one MQTT connection exists across the application
 */
// export const getAwsIotManager = (): AwsIotManager => {
//   if (!awsIotManagerInstance) {
//     console.log("[mqtt] Creating new AWS IoT Manager instance (singleton)");
//     awsIotManagerInstance = new AwsIotManager();
//   } else {
//     console.log("[mqtt] Reusing existing AWS IoT Manager instance");
//   }
//   return awsIotManagerInstance;
// };

export default AwsIotManager;
// Object.freeze(new AwsIotManager());
