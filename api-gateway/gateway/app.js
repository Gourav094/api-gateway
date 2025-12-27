const express = require('express')
const app = express();
const PORT = process.env.PORT || 3000;

// parse json payload
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req,res) => {
    res.status(200).json({message: "Welcome to API Gateway!"})
})

app.get('/health', (req,res) => {
    res.status(200).json({
        status: "Healthy",
        timestamp: new Date().toISOString()
    })
})

app.use((err, req, res, next) => {
    console.log('Error', err.message);
    res.status(500).json({
        error: err.message || "Internal server error"
    })
})

const server = app.listen(PORT,() => {
    console.log(` Api gateway running on ${PORT}`)
})