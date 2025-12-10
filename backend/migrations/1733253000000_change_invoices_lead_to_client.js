exports.up = async (pgm) => {
    // Drop old foreign key constraint
    pgm.dropConstraint('invoices', 'invoices_lead_id_fkey', { ifExists: true });

    // Rename column from lead_id to client_id
    pgm.renameColumn('invoices', 'lead_id', 'client_id');

    // Add new foreign key constraint to clients table
    pgm.addConstraint('invoices', 'invoices_client_id_fkey', {
        foreignKeys: {
            columns: 'client_id',
            references: 'clients(id)',
            onDelete: 'CASCADE'
        }
    });

    // Drop old index
    pgm.dropIndex('invoices', 'lead_id', { ifExists: true });

    // Create new index
    pgm.createIndex('invoices', 'client_id');
};

exports.down = async (pgm) => {
    // Drop new foreign key constraint
    pgm.dropConstraint('invoices', 'invoices_client_id_fkey');

    // Rename column back
    pgm.renameColumn('invoices', 'client_id', 'lead_id');

    // Add old foreign key constraint
    pgm.addConstraint('invoices', 'invoices_lead_id_fkey', {
        foreignKeys: {
            columns: 'lead_id',
            references: 'leads(id)',
            onDelete: 'CASCADE'
        }
    });

    // Drop new index
    pgm.dropIndex('invoices', 'client_id', { ifExists: true });

    // Create old index
    pgm.createIndex('invoices', 'lead_id');
};
