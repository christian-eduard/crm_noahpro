exports.up = (pgm) => {
    pgm.addColumns('proposals', {
        signature_data: {
            type: 'jsonb',
            default: null
        }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('proposals', ['signature_data']);
};
