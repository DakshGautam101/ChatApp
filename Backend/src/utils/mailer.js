import nodemailer from "nodemailer";

const createTransporter = () => {
    const isGmail = process.env.EMAIL_HOST?.includes("gmail") || process.env.EMAIL_SERVICE === "gmail";

    if (isGmail && process.env.EMAIL_SERVICE === "gmail") {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 4000,
        });
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
        secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
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
