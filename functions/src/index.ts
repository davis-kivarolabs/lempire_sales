// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { onSchedule } from "firebase-functions/v2/scheduler";
// import * as admin from "firebase-admin";
// import * as functions from "firebase-functions";
// import axios from "axios";

// admin.initializeApp();

// const WHATSAPP_PHONE_NUMBER_ID = functions.config().whatsapp.phone_id;
// const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;

// // const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
// // const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// async function sendWhatsAppMessage(docId: string, data: any) {
//     const phone = data.message_number?.toString()?.replace(/\D/g, "");
//     if (!phone) return;

//     const payload = {
//         messaging_product: "whatsapp",
//         to: phone,
//         type: "template",
//         template: {
//             name: "lempire_vanitha_veedu",
//             language: { code: "en_US" },
//             components: [
//                 {
//                     type: "header",
//                     parameters: [
//                         { type: "text", text: data.client_name || "Customer" }
//                     ]
//                 },
//                 {
//                     type: "body",
//                     parameters: [
//                         { type: "text", text: data.scope || "your project" }
//                     ]
//                 }
//             ]
//         }
//     };

//     try {
//         await axios.post(
//             `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
//             payload,
//             {
//                 headers: {
//                     Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         await admin.firestore().collection("submissions").doc(docId).update({
//             whatsapp_sent: true,
//             whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
//             whatsapp_error: admin.firestore.FieldValue.delete(),
//         });

//         functions.logger.info(`WhatsApp sent to ${phone} (doc: ${docId})`);

//     } catch (err: any) {
//         const errorInfo = err.response?.data || err.message;
//         functions.logger.error(`Failed WhatsApp send to ${phone}`, errorInfo);

//         await admin.firestore().collection("submissions").doc(docId).update({
//             whatsapp_sent: false,
//             whatsapp_error: errorInfo,
//         });
//     }
// }


// export const scheduleWhatsAppMessage = onDocumentCreated(
//     "submissions/{docId}",
//     async (event) => {
//         const snap = event.data;
//         if (!snap) return;
//         const data = snap.data() || {};

//         if (!data.message_number) return;

//         // Skips
//         const skipScopes = ["Just enquiry", "Dealers"];
//         if (skipScopes.includes(data.scope)) {
//             await snap.ref.update({
//                 whatsapp_sent: false,
//                 whatsapp_skipped: true,
//                 whatsapp_skip_reason: "Not eligible based on scope",
//             });
//             return;
//         }

//         const now = new Date();
//         const sendTime = new Date(now);

//         const hour = now.getHours();
//         if (hour >= 11 && hour < 14) {
//             sendTime.setHours(sendTime.getHours() + 4); // Delay to avoid lunch-time call activity
//         } else if (hour >= 18) {
//             sendTime.setDate(sendTime.getDate() + 1);
//             sendTime.setHours(8, 0, 0, 0);
//         } else {
//             sendTime.setHours(8, 0, 0, 0);
//         }

//         await snap.ref.update({
//             scheduled_send_at: sendTime,
//             whatsapp_sent: false,
//             whatsapp_skipped: false,
//         });

//         functions.logger.info(`Message scheduled for ${sendTime.toISOString()} (doc: ${event.params.docId})`);
//     }
// );


// export const sendScheduledWhatsApps = onSchedule(
//     { schedule: "every 5 minutes", timeZone: "Asia/Kolkata" },
//     async () => {
//         const now = new Date();

//         const snaps = await admin
//             .firestore()
//             .collection("submissions")
//             .where("whatsapp_sent", "==", false)
//             .where("whatsapp_skipped", "==", false)
//             .where("scheduled_send_at", "<=", now)
//             .orderBy("scheduled_send_at", "asc")
//             .limit(10) // rate control (prevents sending too many at once)
//             .get();

//         for (const doc of snaps.docs) {
//             await sendWhatsAppMessage(doc.id, doc.data());
//         }
//     }
// );


import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import axios from "axios";

admin.initializeApp();

// Define secrets for 2nd Gen
const WHATSAPP_PHONE_ID = defineSecret("WHATSAPP_PHONE_ID");
const WHATSAPP_ACCESS_TOKEN = defineSecret("WHATSAPP_ACCESS_TOKEN");

async function sendWhatsAppMessage(docId: string, data: any) {
    const phone = data.message_number?.toString()?.replace(/\D/g, "");
    if (!phone) return;

    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_ACCESS_TOKEN;

    const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
            name: "lempire_vanitha_veedu",
            language: { code: "en_US" },
            components: [
                {
                    type: "header",
                    parameters: [
                        { type: "text", text: data.client_name || "Customer" }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: data.scope || "your project" }
                    ]
                }
            ]
        }
    };

    try {
        await axios.post(
            `https://graph.facebook.com/v22.0/${phoneId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        await admin.firestore().collection("submissions").doc(docId).update({
            whatsapp_sent: true,
            whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
            whatsapp_error: admin.firestore.FieldValue.delete(),
        });

        functions.logger.info(`WhatsApp sent to ${phone} (doc: ${docId})`);

    } catch (err: any) {
        const errorInfo = err.response?.data || err.message;
        functions.logger.error(`Failed WhatsApp send to ${phone}`, errorInfo);

        await admin.firestore().collection("submissions").doc(docId).update({
            whatsapp_sent: false,
            whatsapp_error: errorInfo,
        });
    }
}

// Firestore Trigger
export const scheduleWhatsAppMessage = onDocumentCreated(
    { document: "submissions/{docId}", secrets: [WHATSAPP_PHONE_ID, WHATSAPP_ACCESS_TOKEN] },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const data = snap.data() || {};

        if (!data.message_number) return;

        const skipScopes = ["Just enquiry", "Dealers"];
        if (skipScopes.includes(data.scope)) {
            await snap.ref.update({
                whatsapp_sent: false,
                whatsapp_skipped: true,
                whatsapp_skip_reason: "Not eligible based on scope",
            });
            return;
        }

        const now = new Date();
        const sendTime = new Date(now);

        const hour = now.getHours();
        if (hour >= 11 && hour < 14) {
            sendTime.setHours(sendTime.getHours() + 4);
        } else if (hour >= 18) {
            sendTime.setDate(sendTime.getDate() + 1);
            sendTime.setHours(8, 0, 0, 0);
        } else {
            sendTime.setHours(8, 0, 0, 0);
        }

        await snap.ref.update({
            scheduled_send_at: sendTime,
            whatsapp_sent: false,
            whatsapp_skipped: false,
        });

        functions.logger.info(`Message scheduled for ${sendTime.toISOString()} (doc: ${event.params.docId})`);
    }
);

// Scheduler Trigger
export const sendScheduledWhatsApps = onSchedule(
    { schedule: "every 5 minutes", timeZone: "Asia/Kolkata", secrets: [WHATSAPP_PHONE_ID, WHATSAPP_ACCESS_TOKEN] },
    async () => {
        const now = new Date();

        const snaps = await admin
            .firestore()
            .collection("submissions")
            .where("whatsapp_sent", "==", false)
            .where("whatsapp_skipped", "==", false)
            .where("scheduled_send_at", "<=", now)
            .orderBy("scheduled_send_at", "asc")
            .limit(10)
            .get();

        for (const doc of snaps.docs) {
            await sendWhatsAppMessage(doc.id, doc.data());
        }
    }
);



///////////////////////////////


// const payload = {
//     messaging_product: "whatsapp",
//     to: phone,
//     type: "template",
//     template: {
//         name: "vanitha_veedu",
//         language: { code: "en_US" },
//         components: [
//             {
//                 type: "header",
//                 parameters: [
//                     { type: "text", text: data.client_name || "Customer" }
//                 ]
//             },
//             {
//                 type: "body",
//                 parameters: [
//                     {
//                         type: "text", text: (data.scope === "Just enquiry" || data.scope === "Just enquiry") ? "" : `
//                             We've noted your requirement regarding ${data.scope} and our technical team will be connecting with you shortly to discuss your project in detail.`
//                     }
//                 ]
//             }
//         ]
//     }
// };



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
//         if (!snap) {
//             logger.error("No document data received.");
//             return;
//         }

//         const data = snap.data() as any;
//         if (!data.message_number) {
//             logger.info("No phone number found, skipping message.");
//             return;
//         }

//         const phone = data.message_number.toString().replace(/\D/g, "");
//         logger.info(`New submission — will send WhatsApp to ${phone} after delay.`);

//         // Wait for 4 hours (or shorter in test)
//         await new Promise((resolve) => setTimeout(resolve, DELAY_MS));


//         try {
//             const payload = {
//                 messaging_product: "whatsapp",
//                 to: phone,
//                 type: "template",
//                 template: {
//                     name: "vanitha_veedu",
//                     language: {
//                         code: "en_US"
//                     },
//                     components: [
//                         {
//                             type: "header",
//                             parameters: [
//                                 {
//                                     type: "text",
//                                     text: data.client_name || "Customer"
//                                 }
//                             ]
//                         },
//                         {
//                             type: "body",
//                             parameters: [
//                                 {
//                                     type: "text",
//                                     text: data.scope || "your project"
//                                 }
//                             ]
//                         }
//                     ]
//                 }
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

//             logger.info(`Test WhatsApp message sent to ${phone}`, response.data);

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