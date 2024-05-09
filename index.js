const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3011
require('dotenv').config()



//middleware
app.use(cors())
app.use(express.json())









app.get('/', async(req, res)=>{
    res.send('server responses')
})

app.listen(port, () =>{
    console.log(`survice running on port : ${port}`);
})