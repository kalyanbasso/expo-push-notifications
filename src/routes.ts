import { Router } from "express";
import { sendPushNotification } from "./pushService";

const router = Router();

router.post("/send-push-notification", async (req, res) => {
  const { title, message, tokens, data } = req.body;
  if (!tokens || !title || !message) {
    res.status(400).json({ error: "Campos obrigatórios ausentes" });
    return;
  }

  try {
    const response = await sendPushNotification(tokens, title, message, data);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: "Erro ao enviar notificação" });
  }
});

export default router;
