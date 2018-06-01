const Joi = require('joi');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

const restController = require('./rest_controller');

app.use(cors());	
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/', restController);
//adding a peace of middleWare

// /api/courses/1

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));