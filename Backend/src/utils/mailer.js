import nodemailer from "nodemailer";

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const mailOptions = {
        from,
        to,
        subject,
        html,
        text,
    };
    return transporter.sendMail(mailOptions);
};

export default sendEmail;
