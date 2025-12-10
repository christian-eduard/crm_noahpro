const invoiceEmailService = require('../../services/invoiceEmailService');
const nodemailer = require('nodemailer');

// Mock dependencies
jest.mock('nodemailer');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn().mockResolvedValue('<html>{{clientName}} - {{invoiceNumber}}</html>')
    }
}));

describe('Invoice Email Service', () => {
    let mockTransporter;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
    });

    describe('sendInvoiceEmail', () => {
        const mockInvoice = {
            invoice_number: 'INV-2024-001',
            title: 'Test Invoice',
            description: 'Test Description',
            issue_date: new Date(),
            due_date: new Date(),
            total_amount: 1000,
            payment_status: 'pending',
            token: 'test-token'
        };

        const mockClient = {
            name: 'Test Client',
            email: 'test@example.com'
        };

        it('should send invoice email successfully', async () => {
            const result = await invoiceEmailService.sendInvoiceEmail(mockInvoice, mockClient);

            expect(nodemailer.createTransport).toHaveBeenCalled();
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: mockClient.email,
                subject: `Factura ${mockInvoice.invoice_number}`,
                html: expect.stringContaining(mockClient.name)
            }));
            expect(result).toEqual({ success: true, messageId: 'test-message-id' });
        });

        it('should throw error if email sending fails', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

            await expect(invoiceEmailService.sendInvoiceEmail(mockInvoice, mockClient))
                .rejects.toThrow('SMTP Error');
        });
    });

    describe('sendReceiptEmail', () => {
        const mockPayment = {
            receipt_number: 'REC-2024-001',
            payment_date: new Date(),
            payment_method: 'Transfer',
            amount: 500
        };

        const mockInvoice = {
            invoice_number: 'INV-2024-001',
            payment_status: 'partial',
            remaining_amount: 500,
            token: 'test-token'
        };

        const mockClient = {
            name: 'Test Client',
            email: 'test@example.com'
        };

        it('should send receipt email successfully', async () => {
            const result = await invoiceEmailService.sendReceiptEmail(mockPayment, mockInvoice, mockClient);

            expect(nodemailer.createTransport).toHaveBeenCalled();
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: mockClient.email,
                subject: `Recibo de Pago ${mockPayment.receipt_number}`,
                html: expect.stringContaining(mockClient.name)
            }));
            expect(result).toEqual({ success: true, messageId: 'test-message-id' });
        });
    });
});
