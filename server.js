
const app = require('./app');
const { connectDB } = require('./config/database');
const { initSocket } = require("./Utills/socket");

const PORT=process.env.PORT || 4000;


connectDB().then(() => {
    console.log('Connected to MongoDB');
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    initSocket(server);
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

 


