import * as mqtt from "mqtt";
import * as dotenv from "dotenv";
import * as WebSocket from "ws";
import * as http from "http";
import pool from "./db.js";

dotenv.config({
  path: ".env",
});

const server = http.createServer();
const wss = new WebSocket.WebSocketServer({ server });
const port = 8080;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

let clients = {};

wss.on("connection", function connection(ws, req) {
  const ip = req.socket.remoteAddress;
  console.log(`New connection from ${ip}`);
  const connId = Math.random().toString(36).substring(7);
  clients[connId] = { ws, req };

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
    ws.send("pong");
  });

  ws.on("close", function close() {
    console.log(`Connection closed from ${ip} and id ${connId}`);
    delete clients[connId];
  });
});

async function serialToDepartment(serial) {
  const departmentCoords = {
    1: [11.86, 54.77],
    4: [11.86, 54.77],
    5: [11.86, 54.77],
    3: [11.79, 55.23],
    7: [12.41, 55.62],
  };

  let ret = undefined;

  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT dep.id FROM department dep
      INNER JOIN bed b ON b.department = dep.id
      INNER JOIN device d ON b.device = d.id
      WHERE d.serial_number = '${serial}'
    `);
    if (res.rows) {
      ret = departmentCoords[res.rows[0]["id"]];
    }
    client.release();
  } catch (err) {
    console.error(err);
  }

  return ret;
}

async function main() {
  const client = mqtt.connect({
    host: process.env.MQTT_HOST,
    port: parseInt(process.env.MQTT_PORT),
    protocol: "mqtts",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  // setup the callbacks
  client.on("connect", async function () {
    console.log("Connected");
  });

  client.on("error", function (error) {
    console.error("MQTT error: " + error);
    process.exit(1);
  });

  client.on("close", function (error) {
    console.error("Connection closed: " + error);
    process.exit(1);
  });

  client.subscribe("api/post/#");
  //   client.subscribe("api/post/node_is_healthy");

  let counter = 0;
  let start = Date.now();

  client.on("message", async function (topic, message) {
    const msg = JSON.parse(message.toString());
    const clientSplit = msg["client"].split("_");
    const serial = clientSplit[clientSplit.length - 2];
    // console.log("Message received: " + serial);

    const coords = await serialToDepartment(serial);
    console.log(coords);
    if (coords) {
      // broadcast to all clients
      for (const connId in clients) {
        const client = clients[connId];
        client.ws.send(JSON.stringify({ coords: coords }));
      }
    }

    counter += 1;
    if (counter % 10 === 0) {
      const end = Date.now();
      const seconds = (end - start) / 1000;
      const avg = counter / seconds;
      console.log(`Received ${counter} messages in ${seconds} seconds`);
      console.log(`Average: ${avg} messages/second`);
    }
  });
}

main();
