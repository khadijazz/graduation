 const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

app

mongoose.connect('mongodb://127.0.0.1:27017/ehtmam').then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
 


app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
  res.send('Hello, World!');
});



app.listen(4000, () => {
  console.log('Server is running on port 3000');
});
 
 