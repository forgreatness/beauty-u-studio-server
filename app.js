const express = require('express')
const app = express()
const port = 80

app.get('/', (req, res) => {
    var today = new Date()
    res.send({
        today,
        "Name": "CloudDev"
    })
    
})

app.listen(port)
