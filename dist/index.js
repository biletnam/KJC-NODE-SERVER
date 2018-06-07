'use strict';

var Joi = require('joi');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
var dbConfig = require('./config/oracle-db-config');

var restController = require('./rest_controller');

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

var port = process.env.PORT || 5000;
app.listen(port, function () {
  return console.log('Listening on port ' + port + '...');
});
//# sourceMappingURL=index.js.map