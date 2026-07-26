//Servidor
const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(express.json()); //lee el json del body
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*8} //duración de sesión activa aqui es por 8 horas
}));

//esto es para proteger rutas y que nada mas usuarios logueados pasen
function requerirSesion(req, res, next){
    if(!req.session.usuario){
        return res.status(401).json({error: "No has iniciado sesión"});
    }
    next();
}

//codigo para registro de los usuarios en el sistema
app.post("/api/registro", async(req, res) => {
    try{
        //guardar los datos que se ingresan en el formulario
        const {nombre, apellidos, usuario, correo, password} = req.body;

        //valida que todos los campos tengan contenido
        if(!nombre || !apellidos || !usuario || !correo || !password){
            return res.status(400).json({error: "Todos los campos son obligatorios"});
        }

        //valida la longitud de la contraseña
        if(password.length < 6){
            return res.status(400).json({error: "La contraseña debe de tener por lo menos 6 caracteres"});
        }

        //ejecuta una consulta a la BD para ver si el correo o el usuario ya existen
        const [existe] = await pool.query(
            "SELECT id FROM usuarios WHERE email = ? OR usuario = ?",
            [correo, usuario]
        );
        if(existe.length > 0){
            return res.status(400).json({error: "Ese correo o usuario ya está registrado"});
        }

        //hashear la contraseña del usuario
        const passwordHash = await bcrypt.hash(password, 10);

        //ejecuta una consulta para registrar al usuario en la BD
        await pool.query(
            "INSERT INTO usuarios (nombre, apellidos, usuario, email, password_hash) VALUES(?, ?, ?, ?, ?)",
            [nombre, apellidos, usuario, correo, passwordHash]
        );

        res.status(201).json({mensaje: "Cuenta creada con éxito"});

    } catch(error){
        console.error(error);
        res.status(500).json({error: "Hubo un error en el servidor"});
    }
});

//codigo para el login de usuarios
app.post("/api/login", async(req, res) => {
    try{
        const {correo, password} = req.body;

        if(!correo || !password){
            return res.status(400).json({error: "Correo y contraseña son obligatorios"});
        }

        const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [correo]);
        if(rows.length === 0){
            return res.status(401).json({error: "Credenciales incorrectas"});
        }

        const usuarioDB = rows[0];
        const passwordValido = await bcrypt.compare(password, usuarioDB.password_hash);

        if(!passwordValido){
            return res.status(401).json({error: "Credenciales incorrectas"});
        }

        //guarda los datos del usuario en la sesión
        req.session.usuario = {
            id: usuarioDB.id,
            nombre: usuarioDB.nombre,
            apellidos: usuarioDB.apellidos,
            usuario: usuarioDB.usuario,
            email: usuarioDB.email,
            rol: usuarioDB.rol
        };

        res.json({mensaje: "Login exitoso"});

    } catch(error){
        console.error(error);
        res.status(500).json({error: "Hubo un error en el servidor"});
    }
});

//devuelve los datos de la sesión activa
app.get("/api/sesion", requerirSesion, (req, res) => {
    res.json(req.session.usuario);
});

//cierra la sesión
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => res.json({mensaje: "Sesión cerrada"}));
});

//dashboard con info dinamica
app.get("/api/dashboard", requerirSesion, async (req, res) => {
    try{
        //contadores para info de las card del dashboard
        const [[{totalAnimales}]] = await pool.query(
            "SELECT COUNT(*) AS totalAnimales FROM animales"
        );
        const [[{enTratamiento}]] = await pool.query(
            "SELECT COUNT(*) AS enTratamiento FROM animales WHERE estado = 'en tratamiento'"
        );
        const [[{totalPropietarios}]] = await pool.query(
            "SELECT COUNT(*) AS totalPropietarios FROM propietarios"
        );
        const [[{citasHoyContador}]] = await pool.query(
            "SELECT COUNT(*) AS citasHoyContador FROM consultas WHERE DATE(fecha_consulta) = CURDATE()"
        );

        //Lista de las citas de hoy
        const [citasHoy] = await pool.query(
            `SELECT c.id, TIME_FORMAT(c.fecha_consulta, '%H:%i') AS hora,
            a.nombre AS animal, c.motivo, c.estado FROM consultas c
            JOIN animales a ON a.id = c.animal_id WHERE DATE(c.fecha_consulta) = CURDATE()
            ORDER BY c.fecha_consulta ASC` 
        );

        //para las notis
        const [notificaciones] = await pool.query(
            `SELECT c.id, TIME_FORMAT(c.fecha_consulta, '%H:%i') AS hora, a.nombre AS animal, c.motivo
            FROM consultas c JOIN animales a ON a.id = c.animal_id ORDER BY c.fechaCreacion DESC LIMIT 5`
        );

        //obtener la fecha actual para el sistema
        const fecha = new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        res.json({
            usuario: req.session.usuario,
            fecha,
            metricas: {
                citasHoyContador, 
                totalAnimales, 
                enTratamiento, 
                totalPropietarios
            },
            citasHoy,
            notificaciones
        });
    }catch(error){
        console.log(error);
        res.status(500).json({error: "Ocurrió un problema en el servidor"});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));