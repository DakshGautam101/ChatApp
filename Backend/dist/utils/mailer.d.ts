interface sendEmailInterface {
    to: string;
    subject: string;
    html: string;
    text?: string | null;
}
declare const sendEmail: ({ to, subject, html, text }: sendEmailInterface) => Promise<import("nodemailer/lib/smtp-transport/index.js").SentMessageInfo>;
export default sendEmail;
//# sourceMappingURL=mailer.d.ts.map