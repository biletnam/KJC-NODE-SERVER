const defaultPromiseErrorHandler = (error) => {
    console.log(error);
}
const addPrefixErrorHandler = (error, prefix) => {
    console.log(error);
    console.log(prefix + ' ', error);
}
const getExceptKeyObject = (object, exceptKeyArray) => {
    const wrapping = {};
    Object.keys(object).map((key) => {
        if(exceptKeyArray.indexOf(key) === -1) {
            wrapping[key] = object[key];
        }
    })
    return wrapping;
}

module.exports = {
    defaultPromiseErrorHandler,
    getExceptKeyObject,
    addPrefixErrorHandler
}
