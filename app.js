const express = require('express')
const app = express()
const port = process.env.PORT || 80

app.get('', (req, res) => {
    var today = new Date()

    response.write(today)
    response.end()
    
})

app.listen(port)