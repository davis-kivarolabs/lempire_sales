// functions/index.js (Node 18+)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
admin.initializeApp();
const db = admin.firestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendOtp = functions.https.onRequest(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const otp = generateOtp();
    const hashedOtp = otp; // You should hash with bcrypt in production.
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10*60*1000)); // 10 min

    await db.collection("emailOtps").doc(email).set({
      otp: hashedOtp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const msg = {
      to: email,
      from: "no-reply@yourdomain.com",
      subject: "Your OTP code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    };
    await sgMail.send(msg);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

exports.verifyOtp = functions.https.onRequest(async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Missing" });

    const doc = await db.collection("emailOtps").doc(email).get();
    if (!doc.exists) return res.status(400).json({ message: "OTP not found" });

    const data = doc.data();
    const now = admin.firestore.Timestamp.now();
    if (data.expiresAt.toMillis() < now.toMillis()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (data.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Optional: update user's password using Admin SDK
    const userRecord = await admin.auth().getUserByEmail(email);
    if (newPassword) {
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    }

    // delete OTP or mark used
    await db.collection("emailOtps").doc(email).delete();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
