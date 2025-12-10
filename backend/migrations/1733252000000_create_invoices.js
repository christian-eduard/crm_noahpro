exports.up = async (pgm) => {
    // Create invoices table
    pgm.createTable('invoices', {
        id: { type: 'serial', primaryKey: true },
        invoice_number: { type: 'varchar(50)', notNull: true, unique: true },
        client_id: {
            type: 'integer',
            notNull: true,
            references: 'clients',
            onDelete: 'CASCADE'
        },
        proposal_id: {
            type: 'integer',
            references: 'proposals',
            onDelete: 'SET NULL'
        },

        // Invoice data
        title: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        items: { type: 'jsonb', notNull: true },
        subtotal: { type: 'decimal(10,2)', notNull: true },
        tax_rate: { type: 'decimal(5,2)', notNull: true, default: 21.00 },
        tax_amount: { type: 'decimal(10,2)', notNull: true },
        total_amount: { type: 'decimal(10,2)', notNull: true },

        // Payment tracking
        paid_amount: { type: 'decimal(10,2)', notNull: true, default: 0.00 },
        remaining_amount: { type: 'decimal(10,2)', notNull: true },
        payment_status: {
            type: 'varchar(20)',
            notNull: true,
            default: 'pending'
        },

        // Dates
        issue_date: { type: 'date', notNull: true },
        due_date: { type: 'date' },
        paid_date: { type: 'date' },

        // Tracking
        token: { type: 'varchar(255)', notNull: true, unique: true },
        email_sent: { type: 'boolean', notNull: true, default: false },
        email_sent_at: { type: 'timestamp' },
        email_opened: { type: 'boolean', notNull: true, default: false },
        email_opened_at: { type: 'timestamp' },
        viewed: { type: 'boolean', notNull: true, default: false },
        viewed_at: { type: 'timestamp' },
        view_count: { type: 'integer', notNull: true, default: 0 },

        // Metadata
        notes: { type: 'text' },
        created_by: {
            type: 'integer',
            references: 'users'
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // Create indexes for invoices
    pgm.createIndex('invoices', 'client_id');
    pgm.createIndex('invoices', 'token');
    pgm.createIndex('invoices', 'invoice_number');
    pgm.createIndex('invoices', 'payment_status');
    pgm.createIndex('invoices', 'issue_date');

    // Create invoice_payments table
    pgm.createTable('invoice_payments', {
        id: { type: 'serial', primaryKey: true },
        invoice_id: {
            type: 'integer',
            notNull: true,
            references: 'invoices',
            onDelete: 'CASCADE'
        },

        // Payment data
        amount: { type: 'decimal(10,2)', notNull: true },
        payment_method: { type: 'varchar(50)' },
        payment_date: { type: 'date', notNull: true },
        reference: { type: 'varchar(100)' },

        // Receipt
        receipt_number: { type: 'varchar(50)', notNull: true, unique: true },
        receipt_sent: { type: 'boolean', notNull: true, default: false },
        receipt_sent_at: { type: 'timestamp' },

        // Metadata
        notes: { type: 'text' },
        created_by: {
            type: 'integer',
            references: 'users'
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // Create indexes for invoice_payments
    pgm.createIndex('invoice_payments', 'invoice_id');
    pgm.createIndex('invoice_payments', 'receipt_number');
    pgm.createIndex('invoice_payments', 'payment_date');

    // Add invoice settings to crm_settings
    pgm.addColumns('crm_settings', {
        auto_invoice_on_proposal_accept: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        invoice_prefix: {
            type: 'varchar(10)',
            notNull: true,
            default: 'INV'
        },
        next_invoice_number: {
            type: 'integer',
            notNull: true,
            default: 1
        },
        default_tax_rate: {
            type: 'decimal(5,2)',
            notNull: true,
            default: 21.00
        },
        invoice_due_days: {
            type: 'integer',
            notNull: true,
            default: 30
        }
    });

    // Create trigger to update updated_at
    pgm.createTrigger('invoices', 'update_invoices_updated_at', {
        when: 'BEFORE',
        operation: 'UPDATE',
        function: 'update_updated_at_column',
        level: 'ROW'
    });
};

exports.down = async (pgm) => {
    pgm.dropTrigger('invoices', 'update_invoices_updated_at');
    pgm.dropColumns('crm_settings', [
        'auto_invoice_on_proposal_accept',
        'invoice_prefix',
        'next_invoice_number',
        'default_tax_rate',
        'invoice_due_days'
    ]);
    pgm.dropTable('invoice_payments');
    pgm.dropTable('invoices');
};
