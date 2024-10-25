require('dotenv').config(); // Para cargar las variables de entorno
const express = require('express');
const mysql = require('mysql2/promise'); // Cambiamos a mysql2 para usar promesas
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator'); // Para validar datos de entrada

const app = express();
const PORT = process.env.PORT || 5000; // Usar el puerto 5000 por defecto

// Middleware
// Configura CORS para permitir solicitudes desde tu frontend
app.use(cors({
    origin: '*',  // Reemplaza con la URL de tu aplicación
    methods: 'GET,POST,PUT,DELETE',
    credentials: true // Si usas cookies o autenticación basada en sesión
}));

// Configura las cabeceras de seguridad
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Configura el body parser para leer los datos del cliente 
app.use(bodyParser.json());

// Configura el pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Cambia esto si tienes contraseña
    database: process.env.DB_DATABASE || 'proyectoPIT',
    port: process.env.DB_PORT || 3306, // Puerto por defecto en XAMPP
    waitForConnections: true,
    connectionLimit: 10,  // Limitar a 10 conexiones simultáneas
    queueLimit: 0
});

// Ruta para registrar un usuario con verificación de Firebase UID
app.post('/register', [
    body('email').isEmail().withMessage('Debe ser un correo válido'),
    body('firebaseUID').not().isEmpty().withMessage('UID de Firebase es necesario')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, firebaseUID } = req.body;

    // Debug: Verificar los datos que llegan al servidor
    console.log('Datos recibidos para registro:', { email, firebaseUID });

    try {
        // Verificar si el usuario ya existe en la base de datos
        const [existingUser] = await pool.query('SELECT * FROM owners WHERE id = ?', [firebaseUID]);
        
        console.log('Resultado de la búsqueda de usuario existente:', existingUser);

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Este usuario ya está registrado.' });
        }

        // Insertar el nuevo usuario en la base de datos
        const [insertResult] = await pool.query(
            'INSERT INTO owners (email, id) VALUES (?, ?)',
            [email, firebaseUID]
        );

        // Debug: Verificar el resultado de la inserción
        console.log('Resultado de la inserción del usuario:', insertResult);

        res.status(201).json({ message: 'Usuario registrado correctamente.', data: insertResult });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para completar el perfil del usuario en MySQL
app.post('/complete-profile', async (req, res) => {
    const { id, firstName, lastName1, lastName2, address } = req.body;
    
    // Imprimir los datos recibidos
    console.log('Datos recibidos para actualizar perfil:', { id, firstName, lastName1, lastName2, address });

    // Aquí colocamos el console.log para verificar que el ID esté correcto
    console.log('ID recibido en el servidor:', id);

    // Asegúrate de que el ID es un string y no un array
    const userId = id;

    try {
        // Actualiza el perfil del usuario usando el ID como identificador
        const queryUpdate = `
            UPDATE owners 
            SET nombre = ?, apellido1 = ?, apellido2 = ?, direccion = ? 
            WHERE id = ?
        `;
        const [updateResult] = await pool.query(queryUpdate, [firstName, lastName1, lastName2, address, userId]);

        console.log('Resultado de la actualización:', updateResult);

        // Obtener el email del usuario que acaba de actualizar su perfil usando su ID
        const querySelect = 'SELECT email, nombre, apellido1, apellido2, direccion FROM owners WHERE id = ?';
        const [result] = await pool.query(querySelect, [userId]);

        // Verificar el resultado de la consulta para obtener el email
        console.log('Resultado de la consulta para obtener el email:', result);

        if (result.length === 0) {
            return res.status(404).json({ message: 'No se encontró el usuario después de la actualización.' });
        }

        // Devolver el email como respuesta
        return res.status(200).json({ 
            message: 'Perfil actualizado exitosamente.', 
            email: result[0].email,
            nombre: result[0].nombre,
            apellido1: result[0].apellido1,
            apellido2: result[0].apellido2,
            direccion: result[0].direccion
        });

    } catch (error) {
        // Imprimir el error exacto en el servidor
        console.error('Error al actualizar el perfil:', error);
        return res.status(500).json({ error: 'Error al guardar el perfil.' });
    }
});
  
// Ruta para registrar un nuevo usuario
app.post('/registrar-usuario', async (req, res) => {
    const { id } = req.body;
  
    const query = 'INSERT INTO usuarios (id) VALUES (?)';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Error ejecutando la inserción:', err);
        return res.status(500).send('Error del servidor');
      }
  
      res.json({
        success: true,
        message: 'Usuario registrado exitosamente'
      });
    });
});

// Ruta para añadir mascotas
app.post('/add-pet', async (req, res) => {
    const { pets, id } = req.body;  // Cambiamos id_owner por id
    
    if (!id) {
        return res.status(400).json({ message: "ID del dueño no encontrado." });
    }

    if (!pets || pets.length === 0) {
        return res.status(400).json({ message: "No se recibieron datos de mascotas." });
    }

    try {
        for (const pet of pets) {
            const { nombre, tipo_mascota, foto, descripcion } = pet;

            if (!nombre || !tipo_mascota) {
                return res.status(400).json({ message: "Faltan datos obligatorios de la mascota." });
            }

            const query = `
                INSERT INTO mascotas (id_owner, nombre, tipo_mascota, foto, descripcion)
                VALUES (?, ?, ?, ?, ?)
            `;

            await pool.query(query, [id, nombre, tipo_mascota, foto || null, descripcion || null]);
        }

        res.status(201).json({ message: "Mascotas añadidas exitosamente." });
    } catch (error) {
        console.error('Error al añadir la mascota:', error);
        res.status(500).json({ error: "Error al añadir las mascotas." });
    }
});


// Ruta para registrar un usuario con verificación de Firebase UID
app.post('/register-google', async (req, res) => {
    const { email, firebaseUID } = req.body;
    
    // Debug: Verificar los datos que llegan al servidor
    console.log('Datos recibidos para registro:', { email, firebaseUID });

    try {
        const [existingUser] = await pool.query('SELECT * FROM owners WHERE id = ?', [firebaseUID]);

        if (existingUser.length > 0) {
            // El usuario ya está registrado, devolvemos el ID del usuario
            return res.status(409).json({ 
                message: 'Este usuario ya está registrado.' ,
                user: existingUser[0]
            });
        }

        const [insertResult] = await pool.query(
            'INSERT INTO owners (email, id) VALUES (?, ?)',
            [email, firebaseUID]
        );

        console.log('Usuario registrado con éxito:', insertResult);
        // Devolver el email en la respuesta JSON

        res.status(201).json({ 
            message: 'Usuario registrado correctamente.',
            user: {
                email: email,
                id: firebaseUID,  // el UID del usuario registrado
                nombre: '',       // Deja estos campos vacíos si aún no se han llenado
                apellido1: '',
                apellido2: '',
                direccion: ''
              }
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// Ruta para el inicio de sesión manual
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [results] = await connection.query('SELECT * FROM owners WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado.' });
        }

        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        // Aquí añadimos un log para verificar qué se está enviando como respuesta
        console.log('Usuario autenticado: ', user);

        return res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido1: user.apellido1,
                apellido2: user.apellido2,
                direccion: user.direccion,
            },
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
