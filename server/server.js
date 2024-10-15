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
app.use(cors());
app.use(bodyParser.json());

// Configura la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Cambia esto si tienes contraseña
    database: process.env.DB_DATABASE || 'proyectoPIT',
    port: process.env.DB_PORT || 3306 // Puerto por defecto en XAMPP
};

let connection;

// Función para crear la conexión
async function connectDB() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos proyectoPIT');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        process.exit(1); // Salir si no puede conectarse
    }
}

// Conectar a la base de datos al inicio
connectDB();

// Ruta para registrar un usuario
app.post('/register',
    // Validaciones
    [
        body('email').isEmail().withMessage('Debe ser un correo válido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Verificar si el usuario ya existe
            const [results] = await connection.query('SELECT * FROM owners WHERE email = ?', [email]);

            if (results.length > 0) {
                return res.status(409).json({ message: 'Usuario ya registrado.' }); // Conflict
            }

            // Encriptar la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar el nuevo usuario en la base de datos
            const query = 'INSERT INTO owners (email, password) VALUES (?, ?)';
            await connection.query(query, [email, hashedPassword]);

            return res.status(201).json({ message: 'Usuario registrado correctamente.' }); // Created

        } catch (error) {
            console.error('Error al registrar el usuario:', error);
            return res.status(500).json({ error: 'Error al registrar el usuario.' });
        }
    }
);

// Ruta para completar el perfil del usuario en MySQL
app.post('/complete-profile', async (req, res) => {
    const { email, firstName, lastName1, lastName2, address } = req.body;
 
    try {
       // Actualiza el perfil del usuario
       const query = `
          UPDATE owners 
          SET nombre = ?, apellido1 = ?, apellido2 = ?, direccion = ? 
          WHERE email = ?
       `;
       await connection.query(query, [firstName, lastName1, lastName2, address, email]);
 
       // Obtener el id_owner del usuario que acaba de actualizar su perfil
       const [result] = await connection.query('SELECT id FROM owners WHERE email = ?', [email]);
 
       return res.status(200).json({ message: 'Perfil actualizado exitosamente.', id_owner: result[0].id });
 
    } catch (error) {
       console.error('Error al actualizar el perfil:', error);
       return res.status(500).json({ error: 'Error al guardar el perfil.' });
    }
 });
 

// Ruta para verificar si el correo electrónico ya está registrado
app.post('/check-email', async (req, res) => {
    const { email } = req.body;

    try {
        // Verificar si el usuario ya existe en la base de datos
        const [results] = await connection.query('SELECT * FROM owners WHERE email = ?', [email]);

        if (results.length > 0) {
            return res.status(409).json({ message: 'El correo ya está registrado.' }); // Conflict
        }

        return res.status(200).json({ message: 'Correo disponible.' });

    } catch (error) {
        console.error('Error al verificar el correo:', error);
        return res.status(500).json({ error: 'Error al consultar la base de datos.' });
    }
});

// Ruta para añadir mascotas
app.post('/add-pet', async (req, res) => {
    const { pets, id_owner } = req.body;  // Asegúrate de que estás obteniendo el array de mascotas y el id_owner correctamente
    
    if (!id_owner) {
        return res.status(400).json({ message: "ID del dueño no encontrado." });
    }

    if (!pets || pets.length === 0) {
        return res.status(400).json({ message: "No se recibieron datos de mascotas." });
    }

    try {
        for (const pet of pets) {
            const { nombre, tipo_mascota, foto, descripcion } = pet;

            // Asegúrate de tener los datos obligatorios
            if (!nombre || !tipo_mascota) {
                return res.status(400).json({ message: "Faltan datos obligatorios de la mascota." });
            }

            // Inserción en la base de datos (ejemplo)
            const query = `
                INSERT INTO mascotas (id_owner, nombre, tipo_mascota, foto, descripcion)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.query(query, [id_owner, nombre, tipo_mascota, foto || null, descripcion || null]);
        }

        res.status(201).json({ message: "Mascotas añadidas exitosamente." });
    } catch (error) {
        console.error('Error al añadir la mascota:', error);
        res.status(500).json({ error: "Error al añadir las mascotas." });
    }
});

app.post('/register-google', async (req, res) => {
    const { email, nombre, apellido1, apellido2, direccion, foto } = req.body;

    try {
        const [results] = await connection.query('SELECT * FROM owners WHERE email = ?', [email]);
        if (results.length > 0) {
            return res.status(409).json({ message: 'Usuario ya registrado.' });
        }

        const query = 'INSERT INTO owners (email, nombre, apellido1, apellido2, direccion, foto) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.query(query, [email, nombre, apellido1, apellido2, direccion, foto]);

        return res.status(201).json({ message: 'Usuario registrado correctamente.' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe
        const [results] = await connection.query('SELECT * FROM owners WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' }); // Usuario no existe
        }

        const user = results[0];

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' }); // Contraseña incorrecta
        }

        // Si el usuario y la contraseña son válidos, se envía una respuesta exitosa
        return res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido1: user.apellido1,
                apellido2: user.apellido2,
                direccion: user.direccion
            }
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
