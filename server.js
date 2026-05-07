
const app = require('./app');
const { connectDB } = require('./config/database');

const PORT=process.env.PORT || 4000;

// connected to mongodb
connectDB().then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
 


