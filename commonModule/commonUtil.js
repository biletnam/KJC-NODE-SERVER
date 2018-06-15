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
const toISOString = (date, separator) => {
    const year = date.getFullYear();
    const m = date.getMonth();
    const month = Number( m + 1) < 10 ? '0' + ( m + 1) : (m + 1)+'';
    const d = date.getDate();
    const dd = Number(d) < 10 ? '0' + d : d;

    return year + separator + month + separator + dd;
}

const toISOTimeString = (date, separator, tSeparator) => {
    const year = date.getFullYear();
    const m = date.getMonth();
    const month = Number( m + 1) < 10 ? '0' + ( m + 1) : (m + 1)+'';
    const d = date.getDate();
    const dd = Number(d) < 10 ? '0' + d : d;

    const h = date.getHours();
    const mi = date.getMinutes();

    const hour =  Number(h) < 10 ? '0' + h : h +'';
    const minute =  Number(m) < 10 ? '0' + m : m +'';
    return year + separator + month + separator + dd + tSeparator + hour + ':' + minute;
}

const toOracleISOTimeString = (date) => {
    const year = date.getFullYear();
    const m = date.getMonth();
    const month = Number( m + 1) < 10 ? '0' + ( m + 1) : (m + 1)+'';
    const d = date.getDate();
    const dd = Number(d) < 10 ? '0' + d : d;

    const h = date.getHours();
    const mi = date.getMinutes();

    const hour =  Number(h) < 10 ? '0' + h : h +'';
    const minute =  Number(m) < 10 ? '0' + m : m +'';
    return year + '' + month + '' + dd + '' + hour + '' + minute;
}
module.exports = {
    defaultPromiseErrorHandler,
    getExceptKeyObject,
    addPrefixErrorHandler,
    toISOString,
    toISOTimeString,
    toOracleISOTimeString
}
