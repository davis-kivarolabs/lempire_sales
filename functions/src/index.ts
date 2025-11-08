// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import * as functions from "firebase-functions";
// import { CloudTasksClient } from "@google-cloud/tasks";
// import * as admin from "firebase-admin";
// import axios from "axios";

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { CloudTasksClient } from "@google-cloud/tasks";
import * as functions from "firebase-functions/v1"; // <-- FIXED
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";


admin.initializeApp();

const WHATSAPP_PHONE_NUMBER_ID = functions.config().whatsapp.phone_id;
const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;

const PROJECT_ID = "vanitha-veed";
const LOCATION = "asia-south1";
const QUEUE = "whatsapp-delay-queue";
const DELAY_SECONDS = 4 * 60 * 60; // 4 hours

// Function URL
const SEND_MESSAGE_URL = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendWhatsAppMessage`;

const tasksClient = new CloudTasksClient();

export const scheduleWhatsAppMessage = onDocumentCreated(
    "submissions/{docId}",
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data() as any;
        if (!data.message_number) return;

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
                    body: Buffer.from(JSON.stringify({ docId: event.params.docId })).toString("base64"),
                },
            },
        });
    }
);

const corsHandler = cors({ origin: true });

export const sendWhatsAppMessage = functions
    .region(LOCATION)
    .https.onRequest((req, res) => {
        // Wrap the app logic inside cors
        corsHandler(req, res, async () => {

            const { docId } = req.body;
            if (!docId) {
                res.status(400).send("Missing docId");
                return;
            }

            const doc = await admin.firestore().collection("submissions").doc(docId).get();
            if (!doc.exists) {
                res.status(404).send("Document not found");
                return;
            }

            const data = doc.data()!;
            const phone = data.message_number.toString().replace(/\D/g, "");

            try {
                const payload = {
                    messaging_product: "whatsapp",
                    to: phone,
                    type: "template",
                    template: {
                        name: "vanitha_veedu",
                        language: { code: "en_US" },
                        components: [
                            { type: "header", parameters: [{ type: "text", text: data.client_name || "Customer" }] },
                            { type: "body", parameters: [{ type: "text", text: data.scope || "your project" }] },
                        ],
                    },
                };

                await axios.post(
                    `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                await doc.ref.update({
                    whatsapp_sent: true,
                    whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
                });

                res.send("Message sent");
            } catch (err: any) {
                await doc.ref.update({ whatsapp_sent: false, whatsapp_error: err.message });
                res.status(500).send(err.message);
            }
        });
    });




// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { logger } from "firebase-functions";
// import axios from "axios";
// import * as admin from "firebase-admin";
// import * as functions from "firebase-functions";

// admin.initializeApp();

// const WHATSAPP_PHONE_NUMBER_ID = functions.config().whatsapp.phone_id;
// const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;

// const DELAY_MS = 4 * 60 * 60 * 1000; // 4 hours

// export const scheduleWhatsAppMessage = onDocumentCreated(
//     "submissions/{docId}",
//     async (event) => {
//         const snap = event.data;
//         if (!snap) return;

//         const data = snap.data() as any;

//         if (!data.message_number) return;

//         const scope = (data.scope || "").toLowerCase().trim();
//         if (scope === "just enquiry" || scope === "dealers") {
//             logger.info(`Skipping WhatsApp for scope: ${data.scope}`);
//             return;
//         }

//         const phone = data.message_number.toString().replace(/\D/g, "");
//         logger.info(`New submission — will send WhatsApp to ${phone} after delay.`);

//         await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

//         try {
//             const payload = {
//                 messaging_product: "whatsapp",
//                 to: phone,
//                 type: "template",
//                 template: {
//                     name: "vanitha_veedu",
//                     language: { code: "en_US" },
//                     components: [
//                         {
//                             type: "header",
//                             parameters: [
//                                 {
//                                     type: "text",
//                                     text: data.client_name || "Customer",
//                                 },
//                             ],
//                         },
//                         {
//                             type: "body",
//                             parameters: [
//                                 {
//                                     type: "text",
//                                     text: data.scope || "your project",
//                                 },
//                             ],
//                         },
//                     ],
//                 },
//             };

//             const response = await axios.post(
//                 `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
//                 payload,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//                         "Content-Type": "application/json",
//                     },
//                 }
//             );

//             logger.info(`WhatsApp message sent to ${phone}`, response.data);

//             await admin.firestore().collection("submissions").doc(event.params.docId).update({
//                 whatsapp_sent: true,
//                 whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
//             });
//         } catch (error: any) {
//             logger.error("Error sending WhatsApp message:", error.response?.data || error.message);

//             await admin.firestore().collection("submissions").doc(event.params.docId).update({
//                 whatsapp_sent: false,
//                 whatsapp_error: error.response?.data || error.message,
//             });
//         }
//     }
// );