//conexion a la BD
const mysql = require("mysql2/promise");
require("dotenv").config();

//pool para no abrir y cerrar conexiones en cada consulta
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;