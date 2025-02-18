import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

type NotificationData = {
  [key: string]: any;
};

async function buildMessages(
  tokens: string[],
  title: string,
  message: string,
  data: NotificationData
) {
  let messagesList = [];
  for (let pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messagesList.push({
      to: pushToken,
      sound: "default",
      title,
      body: message,
      data,
    });
  }

  return messagesList;
}

async function createChunks(chunks: ExpoPushMessage[][], expo: Expo) {
  let tickets: ExpoPushTicket[] = [];
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  return tickets;
}

async function handleReceipt(receiptIdChunks: string[][], expo: Expo) {
  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (let receiptId in receipts) {
        const { status } = receipts[receiptId];
        if (status === "ok") {
          continue;
        } else if (status === "error") {
          const { message, details } = receipts[receiptId];
          console.error(
            `There was an error sending a notification: ${message}`
          );
          if (details && details.error) {
            console.error(`The error code is ${details.error}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  message: string,
  data: NotificationData
) {
  const expo = new Expo();

  const messagesList = await buildMessages(tokens, title, message, data);

  const chunks = expo.chunkPushNotifications(messagesList);
  const tickets = await createChunks(chunks, expo);

  let receiptIds = [];
  for (let ticket of tickets) {
    if (ticket.status === "ok") {
      receiptIds.push(ticket.id);
    }
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  await handleReceipt(receiptIdChunks, expo);
}
