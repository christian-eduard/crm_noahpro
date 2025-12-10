exports.up = (pgm) => {
    // Create proposal_views table for tracking
    pgm.createTable('proposal_views', {
        id: 'id',
        proposal_id: {
            type: 'integer',
            notNull: true,
            references: '"proposals"',
            onDelete: 'CASCADE'
        },
        viewed_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        ip_address: {
            type: 'varchar(45)',
            notNull: false
        },
        user_agent: {
            type: 'text',
            notNull: false
        },
        duration_seconds: {
            type: 'integer',
            notNull: false
        },
        metadata: {
            type: 'jsonb',
            notNull: false
        }
    });

    // Add index for faster queries
    pgm.createIndex('proposal_views', 'proposal_id');
    pgm.createIndex('proposal_views', 'viewed_at');
};

exports.down = (pgm) => {
    pgm.dropTable('proposal_views');
};
