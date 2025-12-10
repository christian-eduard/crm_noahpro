let io;

const initSocketIO = (socketIOInstance) => {
    io = socketIOInstance;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initSocketIO,
    getIO
};
