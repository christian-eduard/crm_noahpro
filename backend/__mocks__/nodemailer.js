const nodemailer = {
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-email-id' }),
        close: jest.fn()
    })
};

module.exports = nodemailer;
