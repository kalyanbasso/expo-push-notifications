import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

type NotificationData = {
  [key: string]: any;
};

export type TSendPushNotification = {
  tokens: string[];
  title: string;
  message: string;
  data: NotificationData;
};

async function generatePushMessages(params: TSendPushNotification) {
  const { tokens, title, message, data } = params;
  const messagesList = [];
  for (const pushToken of tokens) {
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

async function sendPushChunks(expo: Expo, chunks: ExpoPushMessage[][]) {
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  return tickets;
}

async function processReceipts(expo: Expo, receiptIdChunks: string[][]) {
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const receiptId in receipts) {
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
      console.error("Error fetching push notification receipts:", error);
    }
  }
}

export async function sendPushNotificationService(
  params: TSendPushNotification
) {
  const expo = new Expo();

  const messages = await generatePushMessages(params);
  if (messages.length === 0) {
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = await sendPushChunks(expo, chunks);

  const receiptIds = tickets
    .filter((ticket) => ticket.status === "ok")
    .map((ticket) => ticket.id);

  if (receiptIds.length === 0) {
    return;
  }

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  await processReceipts(expo, receiptIdChunks);
}
