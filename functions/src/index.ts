import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import axios from "axios";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

const WHATSAPP_PHONE_NUMBER_ID = functions.config().whatsapp.phone_id;
const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;

// const TEMPLATE_NAME = "vanitha_veedu";

// const DELAY_MS = 4 * 60 * 60 * 1000; // 4 hours
const DELAY_MS = 10 * 1000; // 10 seconds

export const scheduleWhatsAppMessage = onDocumentCreated(
    "submissions/{docId}",
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No document data received.");
            return;
        }

        const data = snap.data() as any;
        if (!data.message_number) {
            logger.info("No phone number found, skipping message.");
            return;
        }

        const phone = data.message_number.toString().replace(/\D/g, "");
        logger.info(`New submission — will send WhatsApp to ${phone} after delay.`);

        // Wait for 4 hours (or shorter in test)
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));


        try {
            const payload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: "vanitha_veedu",
                    language: {
                        code: "en_US"
                    },
                    components: [
                        {
                            type: "header",
                            parameters: [
                                {
                                    type: "text",
                                    text: data.client_name || "Customer"
                                }
                            ]
                        },
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: data.scope || "your project"
                                    // text: data.scope?.[0] || "your project"
                                }
                            ]
                        }
                    ]
                }
            };

            const response = await axios.post(
                `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            logger.info(`Test WhatsApp message sent to ${phone}`, response.data);

            await admin.firestore().collection("submissions").doc(event.params.docId).update({
                whatsapp_sent: true,
                whatsapp_sent_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error: any) {
            logger.error("Error sending WhatsApp message:", error.response?.data || error.message);

            await admin.firestore().collection("submissions").doc(event.params.docId).update({
                whatsapp_sent: false,
                whatsapp_error: error.response?.data || error.message,
            });
        }
    }
);