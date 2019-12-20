'use strict';
const log = console.log

const express = require('express')

const app = express();

app.use(express.static(__dirname + '/public'))
// app.use("/js", express.static(__dirname + '/public/js'))
// app.use("/css",express.static(__dirname +'/public/css'))

app.get('/', (req, res) => {
	// sending a string
	//res.send('This should be the root route!')

	//sending some HTML
	res.sendFile(__dirname+"/index.html")
})




const port = process.env.PORT || 3009
app.listen(port, () => {
	log(`Listening on port ${port}...`)
}) 