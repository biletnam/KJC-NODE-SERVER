const Joi = require('joi');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const dbConfig = require('./config/oracle-db-config');

const restController = require('./rest_controller');

app.use(cors());	
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('jwt-secret', dbConfig.secret);
/*app.set('jwt-secret', dbConfig.secret);*/ //jwt-secret 이라고 이름을 붙여, DbConfig 에 지정한 Secret을 여러 파일에서 사용,
app.use('/static', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/', restController);
//adding a peace of middleWare

// /api/courses/1

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));