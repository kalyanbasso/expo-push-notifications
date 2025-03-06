import { ServerError, Status } from "nice-grpc";
import {
  PushNotificationServiceImplementation,
  DeepPartial,
  SendTenantPushNotificationsRequest,
  SendTenantPushNotificationsResponse,
  UpsertTenantPushNotificationTokenRequest,
  UpsertTenantPushNotificationTokenResponse,
} from "./compiled_proto/notification";
import { sendPushNotificationService } from "./pushService";
import { getToken, saveToken } from "./saveToken";

export class PushNotificationImpl
  implements PushNotificationServiceImplementation
{
  async upsertTenantPushNotificationToken(
    request: UpsertTenantPushNotificationTokenRequest
  ): Promise<DeepPartial<UpsertTenantPushNotificationTokenResponse>> {
    try {
      if (!request.tenantId) {
        throw new ServerError(Status.INVALID_ARGUMENT, "Tenant id is required");
      }
      if (!request.pushNotificationTokens?.expoToken) {
        throw new ServerError(
          Status.INVALID_ARGUMENT,
          "Expo token is required"
        );
      }
      await saveToken(
        "tenant",
        request.tenantId,
        request.pushNotificationTokens.expoToken
      );

      return {};
    } catch (error) {
      throw new ServerError(Status.INTERNAL, "Internal server error");
    }
  }

  async sendTenantPushNotification(
    request: SendTenantPushNotificationsRequest
  ): Promise<DeepPartial<SendTenantPushNotificationsResponse>> {
    try {
      if (!request.tenantId) {
        throw new ServerError(Status.INVALID_ARGUMENT, "Tenant id is required");
      }
      if (!request.pushNotification) {
        throw new ServerError(
          Status.INVALID_ARGUMENT,
          "Notification is required"
        );
      }
      const { title, message, data } = request.pushNotification;
      const response = await getToken("tenant", request.tenantId);

      if (!response) {
        throw new ServerError(Status.NOT_FOUND, "Token not found");
      }

      if (!title) {
        throw new ServerError(Status.INVALID_ARGUMENT, "Title is required");
      }

      if (!message) {
        throw new ServerError(Status.INVALID_ARGUMENT, "Message is required");
      }

      const notificationRequest = {
        tokens: [response],
        title: title,
        message: message,
        data: data,
      };

      await sendPushNotificationService(notificationRequest);

      return {};
    } catch (error: any) {
      throw new ServerError(
        Status.INTERNAL,
        error.message || "Internal server error"
      );
    }
  }
}
