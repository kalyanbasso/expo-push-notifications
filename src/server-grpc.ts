import { createServer } from "nice-grpc";
import { PushNotificationServiceDefinition } from "./compiled_proto/notification";
import { PushNotificationImpl } from "./PushNotificationImpl";
import { connectDB } from "./database";

const server = createServer();

server.add(PushNotificationServiceDefinition, new PushNotificationImpl());

(async () => {
  await connectDB(); // Garante que o banco está conectado antes de qualquer operação
})();

async function startServer() {
  await server.listen("0.0.0.0:8080");
  console.log("Server started");
}

startServer();
