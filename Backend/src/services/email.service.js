import getHTML from "../../constants/EmailTemplate.js";
import sendEmail from "../utils/mailer.js";
import logger from "../utils/logger.js";

const verifyEmail = async function (email, otp) {
    const html = getHTML(otp || "");
    const subject = "Verify your Email";

    console.log(`\n==================================================`);
    console.log(`🔑 [VERIFICATION OTP FOR ${email}]: ${otp}`);
    console.log(`==================================================\n`);

    logger.info(`Verification OTP generated for ${email}: ${otp}`);

    try {
        await sendEmail({ to: email, subject, html });
        logger.info(`Verification email sent successfully to ${email}`);
    } catch (error) {
        logger.error(`Error sending email to ${email} (Network/SMTP timeout):`, {
            error: error.message,
            stack: error.stack,
        });
        console.warn(
            `⚠️ SMTP Email Delivery Failed (${error.message}). Use OTP above for development/testing.`
        );
    }
};

export { verifyEmail };