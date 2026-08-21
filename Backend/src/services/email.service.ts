import getHTML from "../constants/EmailTemplate.js";
import sendEmail from "../utils/mailer.js";
import logger from "../utils/logger.js";

const verifyEmail = async function (email:string, otp:number) {
    const html = getHTML(otp || "");
    const subject = "Verify your Email";

    logger.info(`Verification OTP generated for ${email}: ${otp}`);

    try {
        await sendEmail({ to: email , subject, html });
        logger.info(`Verification email sent successfully to ${email}`);
    } catch (error:any) {
        logger.error(`Error sending email to ${email} (Network/SMTP timeout):`, {
            error: error.message,
            stack: error.stack,
        });
    }
};

// const sendOfflineMessageEmail = async function ({ to, recipientName, senderName, messagePreview }) {
//     if (process.env.ENABLE_OFFLINE_EMAIL !== "true") {
//         logger.info(`[Email Service] Offline message email sending is disabled. Skipping for ${to}`);
//         return;
//     }

//     const subject = `New message from ${senderName || "someone"}`;
//     const html = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
//             <h2 style="color: #2563eb;">Chat App Notification</h2>
//             <p>Hi <strong>${recipientName || "there"}</strong>,</p>
//             <p>You received a new message from <strong>${senderName || "a user"}</strong> while you were offline:</p>
//             <blockquote style="background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; margin: 16px 0; color: #334155;">
//                 "${messagePreview || "New attachment or message"}"
//             </blockquote>
//             <p>Log in to your account to respond.</p>
//         </div>
//     `;

//     logger.info(`Sending offline notification email to ${to}`);
//     await sendEmail({ to, subject, html });
// };

export { verifyEmail };