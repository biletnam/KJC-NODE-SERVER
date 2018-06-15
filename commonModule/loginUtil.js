const jwt = require('jsonwebtoken');
const secret = require('../config/oracle-db-config').secret;

const getToken = (userData) => {
    const p = new Promise((resolve, reject) => {
        jwt.sign({
            _id: userData.USER_ID,
            username: userData.USER_NAME,
            _c_id: userData.CUST_ID,
            isUser: true
        }, secret, {
            expiresIn: '7d',
            issuer: 'localhost'
        }, (err, token) => {
            if(err) reject(err);
            resolve(token);
        })
    })
    return p;
}
const getTokenForNonUser = (nonUserData) => {
    const p = new Promise((resolve, reject) => {
        jwt.sign({
            username: nonUserData.USER_NAME,
            phone: nonUserData.PHONE,
            _c_id: nonUserData.CUST_ID,
            isUser: false
        }, secret, {
            expiresIn: '7d',
            issuer: 'localhost'
        }, (err, token) => {
            if (err) reject(err);
            resolve(token);
        })
    });
    return p;
}
const tokenCheckPromise = (req) => {
    const token = req.headers['x-access-token'] || req.query.token

    // create a promise that decodes the token
    const p = new Promise(
        (resolve, reject) => {
            if(!token) {
                reject(false);
            }
            jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
                if(err) reject(err);
                resolve(decoded)
            })
        }
    )
    // process the promise
    return p;
}
module.exports = {
    getToken,
    tokenCheckPromise,
    getTokenForNonUser
}