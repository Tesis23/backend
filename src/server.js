const express = require('express')
const mysql = require('mysql')
const myconn = require('express-myconnection')

require('dotenv').config()

//console.log(process.env)

var bodyParse = require('body-parser');
const routes = require('./routes')

const app = express()
app.set('port', process.env.PORT_CONN || 9000)
const dbOption = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}


//middlewares
app.use(bodyParse.json({limit: "50mb"}));
app.use(bodyParse.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));
app.use(myconn(mysql, dbOption, 'single')) //single es la estrategia de conexion
app.use(express.json())

//Routes
app.use('/', routes)

//Servir imagenes Estaticas
app.use('/images', express.static('upload_image'))

//corriendo el server
app.listen(app.get('port'), ()=>{
    console.log("El servidor esta corriendo....")
})

module.exports = dbOption