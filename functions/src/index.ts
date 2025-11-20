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
                scheduleTime: { seconds: Math.floor(Date.now() / 1000) + DELAY_SECONDS },
                httpRequest: {
                    httpMethod: "POST",
                    url: SEND_MESSAGE_URL,
                    headers: { "Content-Type": "application/json" },
                    body: Buffer.from(JSON.stringify({ docId: event.params.docId })).toString("base64")
                }
            }
        });
    }
);

// ----------------------- SEND DELAYED WHATSAPP TEMPLATE -----------------------
export const sendWhatsAppMessage = onRequest({ region: LOCATION }, (req, res) => {
    return corsHandler(req, res, async () => {
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

        const payload = {
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
                name: "vanitha_veedu",
                language: { code: "en_US" },
                components: [
                    { type: "header", parameters: [{ type: "text", text: data.client_name || "Customer" }] },
                    { type: "body", parameters: [{ type: "text", text: data.scope || "your project" }] }
                ]
            }
        };

        try {
            await axios.post(
                `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID.value()}/messages`,
                payload,
                {
                    headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}` }
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

// ----------------------- INCOMING REPLY WEBHOOK -----------------------
export const forwardReply = onRequest({ region: LOCATION }, async (req, res) => {
    const VERIFY_TOKEN = "LEMP_WEBHOOK_TOKEN";

    if (req.method === "GET") {
        if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
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
                text: { body: `Client ${fromNumber} replied:\n\n${replyText}` }
            },
            { headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}` } }
        );

        res.sendStatus(200);
    } catch (err) {
        console.log("Forward Error:", err);
        res.sendStatus(500);
    }
});




// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { CloudTasksClient } from "@google-cloud/tasks";
// import * as functions from "firebase-functions/v1";
// import * as admin from "firebase-admin";
// import axios from "axios";
// import cors from "cors";


// admin.initializeApp();

// const WHATSAPP_PHONE_NUMBER_ID = functions.config().whatsapp.phone_id;
// const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;

// const PROJECT_ID = "vanitha-veed";
// const LOCATION = "asia-south1";
// const QUEUE = "whatsapp-delay-queue";
// const DELAY_SECONDS = 4 * 60 * 60; // 4 hours

// // Function URL
// const SEND_MESSAGE_URL = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendWhatsAppMessage`;

// const tasksClient = new CloudTasksClient();

// export const scheduleWhatsAppMessage = onDocumentCreated(
//     "submissions/{docId}",
//     async (event) => {
//         const snap = event.data;
//         if (!snap) return;

//         const data = snap.data() as any;
//         if (!data.message_number) return;

//         const scope = (data.scope || "").toLowerCase().trim();
//         if (scope === "just enquiry" || scope === "dealers") return;

//         const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);

//         await tasksClient.createTask({
//             parent: queuePath,
//             task: {
//                 scheduleTime: {
//                     seconds: Math.floor(Date.now() / 1000) + DELAY_SECONDS,
//                 },
//                 httpRequest: {
//                     httpMethod: "POST",
//                     url: SEND_MESSAGE_URL,
//                     headers: { "Content-Type": "application/json" },
//                     body: Buffer.from(JSON.stringify({ docId: event.params.docId })).toString("base64"),
//                 },
//             },
//         });
//     }
// );

// const corsHandler = cors({ origin: true });

// export const sendWhatsAppMessage = functions
//     .region(LOCATION)
//     .https.onRequest((req, res) => {
//         // Wrap the app logic inside cors
//         corsHandler(req, res, async () => {

//             const { docId } = req.body;
//             if (!docId) {
//                 res.status(400).send("Missing docId");
//                 return;
//             }

//             const doc = await admin.firestore().collection("submissions").doc(docId).get();
//             if (!doc.exists) {
//                 res.status(404).send("Document not found");
//                 return;
//             }

//             const data = doc.data()!;
//             const phone = data.message_number.toString().replace(/\D/g, "");

//             try {
//                 const payload = {
//                     messaging_product: "whatsapp",
//                     to: phone,
//                     type: "template",
//                     template: {
//                         name: "vanitha_veedu",
//                         language: { code: "en_US" },
//                         components: [
//                             { type: "header", parameters: [{ type: "text", text: data.client_name || "Customer" }] },
//                             { type: "body", parameters: [{ type: "text", text: data.scope || "your project" }] },
//                         ],
//                     },
//                 };

//                 await axios.post(
//                     `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
//                     payload,
//                     {
//                         headers: {
//                             Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//                             "Content-Type": "application/json",
//                         },
//                     }
//                 );

//                 await doc.ref.update({
//                     whatsapp_sent: true,
//                     whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
//                 });

//                 res.send("Message sent");
//             } catch (err: any) {
//                 await doc.ref.update({ whatsapp_sent: false, whatsapp_error: err.message });
//                 res.status(500).send(err.message);
//             }
//         });
//     });



// export const forwardReply = functions
//     .region("asia-south1")
//     .https.onRequest(async (req, res) => {

//         const VERIFY_TOKEN = "LEMP_WEBHOOK_TOKEN";

//         // Webhook Verification (GET)
//         if (req.method === "GET") {
//             const mode = req.query["hub.mode"];
//             const token = req.query["hub.verify_token"];
//             const challenge = req.query["hub.challenge"];

//             if (mode === "subscribe" && token === VERIFY_TOKEN) {
//                 res.status(200).send(challenge); // no return
//             } else {
//                 res.sendStatus(403); // no return
//             }
//             return; // end function
//         }

//         // Message Handling (POST)
//         try {
//             const body = req.body;
//             const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

//             if (!messages || !messages[0] || messages[0].type !== "text") {
//                 res.sendStatus(200);
//                 return;
//             }

//             const replyText = messages[0].text.body;
//             const fromNumber = messages[0].from;
//             // const forwardTo = "919778411620";
//             const forwardTo = "919961260138";

//             await axios.post(
//                 `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
//                 {
//                     messaging_product: "whatsapp",
//                     to: forwardTo,
//                     type: "text",
//                     text: {
//                         body: `Client ${fromNumber} replied:\n\n${replyText}`,
//                     },
//                 },
//                 {
//                     headers: {
//                         Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//                         "Content-Type": "application/json",
//                     },
//                 }
//             );

//             res.sendStatus(200);
//         } catch (err) {
//             console.log("Forward Error:", err);
//             res.sendStatus(500);
//         }
//     });