const nodemailer = require('nodemailer');

// Membuat transporter dengan SMTP konfigurasi dari .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Fungsi untuk mengirim email reset password
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} resetToken - Token reset password
 */
const sendPasswordResetEmail = async (toEmail, resetToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://habitflow-websiteversion-10-production.up.railway.app';
    const resetLink = `${frontendUrl}/views/reset-password.html?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Xhabit Support" <no-reply@xhabit.com>',
        to: toEmail,
        subject: 'Password Reset Request - Xhabit',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #10B981; text-align: center;">Reset Your Password</h2>
                <p style="color: #333; font-size: 16px;">Hello,</p>
                <p style="color: #333; font-size: 16px;">We received a request to reset the password for your Xhabit account. If you didn't make this request, you can safely ignore this email.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Verify Link</a>
                </div>
                <p style="color: #666; font-size: 14px;">Alternatively, you can copy and paste the following link into your browser:</p>
                <p style="color: #10B981; font-size: 14px; word-break: break-all;">${resetLink}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">This link is only valid for 1 hour.</p>
                <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Xhabit.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email: ', error);
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail
};
