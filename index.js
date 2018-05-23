const Joi = require('joi');
const express = require('express');
const app = express();
const cors = require('cors');

const restController = require('./rest_controller');

app.use(cors());	
app.use(express.json());
app.use('/static', express.static('public'));
app.use('/', restController);
//adding a peace of middleWare


app.get('/api/posts/:years/:month', (req,res) => {
	res.send(req.query);
})
// /api/courses/1

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));