const express = require('express')
const app = express()
const port = process.env.PORT || 80

app.get('', (req, res) => {
    var today = new Date()

    var time = today.getTime
    var day = today.getDay
    res.send(day + time)
    
})

app.listen(port)