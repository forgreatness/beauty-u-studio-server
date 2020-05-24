const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    var today = new Date()
    res.send(today)
    
})

app.listen(port)