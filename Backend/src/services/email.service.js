import getHTML from "../../constants/EmailTemplate.js";
import sendEmail from "../utils/mailer.js";

const verifyEmail = async function (email, otp) {
    const html = getHTML(otp || "");
    const subject = "Verify your Email";
    try {
        await sendEmail({ to: email, subject, html });
    } catch (error) {
        console.log("Error sending email", error);
    }
};

export { verifyEmail };