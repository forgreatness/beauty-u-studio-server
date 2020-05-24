const express = require('express')
const app = express()
const port = process.env.PORT || 80

app.get('', (req, res) => {
    var today = new Date()

    res.send(<h1>"CloudDev Home Page</h1>)
    
})

app.listen(port)