/**
 * Created by benra on 04/12/2016.
 */

var mysql = require('mysql');

var mysqlpool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'gibsonXC40',
    database: 'navigationdb'
});

module.exports = mysqlpool;