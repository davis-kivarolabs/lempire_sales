import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { CloudTasksClient } from "@google-cloud/tasks";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";

admin.initializeApp();

// Env vars from firebase functions:env:set
const WHATSAPP_PHONE_NUMBER_ID = defineString("WHATSAPP_PHONE_ID");
const WHATSAPP_ACCESS_TOKEN = defineString("WHATSAPP_ACCESS_TOKEN");

const PROJECT_ID = "vanitha-veed";
const LOCATION = "asia-south1";
const QUEUE = "whatsapp-delay-queue";
// const DELAY_SECONDS = 10; // 10 seconds
const DELAY_SECONDS = 4 * 60 * 60; // 4 hours
const SEND_MESSAGE_URL = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendWhatsAppMessage`;

const tasksClient = new CloudTasksClient();
const corsHandler = cors({ origin: true });

// ------------------- SCHEDULE MESSAGE WHEN DOCUMENT CREATED -------------------
export const scheduleWhatsAppMessage = onDocumentCreated(
  { region: LOCATION, document: "submissions/{docId}" },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.message_number) return;

    const scope = (data.scope || "").toLowerCase().trim();
    if (scope === "just enquiry" || scope === "dealers") return;

    const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);

    await tasksClient.createTask({
      parent: queuePath,
      task: {
        scheduleTime: {
          seconds: Math.floor(Date.now() / 1000) + DELAY_SECONDS,
        },
        httpRequest: {
          httpMethod: "POST",
          url: SEND_MESSAGE_URL,
          headers: { "Content-Type": "application/json" },
          body: Buffer.from(
            JSON.stringify({ docId: event.params.docId })
          ).toString("base64"),
        },
      },
    });
  }
);

// ----------------------- SEND DELAYED WHATSAPP TEMPLATE -----------------------
export const sendWhatsAppMessage = onRequest(
  { region: LOCATION },
  (req, res) => {
    return corsHandler(req, res, async () => {
      const { docId } = req.body;
      if (!docId) {
        res.status(400).send("Missing docId");
        return;
      }

      const doc = await admin
        .firestore()
        .collection("submissions")
        .doc(docId)
        .get();
      if (!doc.exists) {
        res.status(404).send("Document not found");
        return;
      }

      const data = doc.data()!;
      const phone = data.message_number.toString().replace(/\D/g, "");

      const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "vanitha_veedu",
          language: { code: "en_US" },
          components: [
            {
              type: "header",
              parameters: [
                { type: "text", text: data.client_name || "Customer" },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: data.scope || "your project" },
              ],
            },
          ],
        },
      };

      try {
        await axios.post(
          `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}`,
            },
          }
        );

        await doc.ref.update({
          whatsapp_sent: true,
          whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.send("Message sent");
      } catch (err: any) {
        await doc.ref.update({
          whatsapp_sent: false,
          whatsapp_error: err.message,
        });
        res.status(500).send(err.message);
      }
    });
  }
);

// ----------------------- INCOMING REPLY WEBHOOK -----------------------
export const forwardReply = onRequest(
  { region: LOCATION },
  async (req, res) => {
    const VERIFY_TOKEN = "LEMP_WEBHOOK_TOKEN";

    if (req.method === "GET") {
      if (
        req.query["hub.mode"] === "subscribe" &&
        req.query["hub.verify_token"] === VERIFY_TOKEN
      ) {
        res.status(200).send(req.query["hub.challenge"]);
        return;
      }
      res.sendStatus(403);
      return;
    }

    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== "text") {
      res.sendStatus(200);
      return;
    }

    const replyText = msg.text.body;
    const fromNumber = msg.from;
    const forwardTo = "919778411620";
    // const forwardTo = "919995623348";

    try {
      await axios.post(
        `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`,
        {
          messaging_product: "whatsapp",
          to: forwardTo,
          type: "text",
          text: { body: `Client ${fromNumber} replied:\n\n${replyText}` },
        },
        {
          headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}` },
        }
      );

      res.sendStatus(200);
    } catch (err) {
      console.log("Forward Error:", err);
      res.sendStatus(500);
    }
  }
);

import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import os from "os";
import fs from "fs";

if (!ffmpegPath) {
  throw new Error("FFmpeg binary not found");
}

ffmpeg.setFfmpegPath(ffmpegPath);

export const convertWebmToMp3 = onObjectFinalized(async (event) => {
  const object = event.data;
  if (!object) return;

  const contentType = object.contentType ?? "";
  const filePath = object.name;

  if (!filePath) return;
  if (!contentType.includes("audio/webm")) return;
  if (filePath.endsWith(".mp3")) return;

  const bucket = getStorage().bucket(object.bucket);
  const tempInput = path.join(os.tmpdir(), path.basename(filePath));
  const outputFilePath = filePath.replace(".webm", ".mp3");
  const tempOutput = path.join(os.tmpdir(), path.basename(outputFilePath));

  // Download
  await bucket.file(filePath).download({ destination: tempInput });

  // Convert
  await new Promise<void>((resolve, reject) => {
    ffmpeg(tempInput)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .save(tempOutput)
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  // Upload
  await bucket.upload(tempOutput, {
    destination: outputFilePath,
    metadata: {
      contentType: "audio/mpeg",
    },
  });

  // Cleanup
  fs.unlinkSync(tempInput);
  fs.unlinkSync(tempOutput);

  console.log(`Converted ${filePath} → ${outputFilePath}`);
});
