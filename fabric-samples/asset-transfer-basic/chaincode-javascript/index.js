'use strict';
//ignore the following line, it is used to import the chaincode
const ehrChainCode = require('./lib/ehrChainCode');

module.exports.ehrChainCode = ehrChainCode;
module.exports.contracts = [ehrChainCode];