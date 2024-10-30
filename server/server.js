require('dotenv').config(); // Para cargar las variables de entorno
const express = require('express');
const mysql = require('mysql2/promise'); // Cambiamos a mysql2 para usar promesas
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Define cuántas veces se hace el hashing, 10 es un número seguro
const { body, validationResult } = require('express-validator'); // Para validar datos de entrada
const app = express();
const PORT = process.env.PORT || 5000; // Usar el puerto 5000 por defecto
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Middleware
// Configura CORS para permitir solicitudes desde el frontend en el puerto 8100
app.use(cors({
    origin: 'http://localhost:8100', // Permite solicitudes desde el origen de tu aplicación frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
    credentials: true // Permitir cookies y otras credenciales si es necesario
}));

// Configura las cabeceras de seguridad
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Configura el body parser para leer los datos del cliente 
app.use(bodyParser.json());

// Configurar directorio de carga de archivos
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Para las imágenes de las tarjetitas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

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
    body('firebaseUID').not().isEmpty().withMessage('UID de Firebase es necesario'),
    body('password').not().isEmpty().withMessage('La contraseña es obligatoria')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, firebaseUID, password } = req.body;

    try {
        // Verificar si el usuario ya existe en la base de datos
        const [existingUser] = await pool.query('SELECT * FROM owners WHERE id = ?', [firebaseUID]);

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Este usuario ya está registrado.' });
        }

        // Hashear (cifrar) la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar el nuevo usuario en la base de datos con la contraseña cifrada
        const [insertResult] = await pool.query(
            'INSERT INTO owners (email, id, password) VALUES (?, ?, ?)',
            [email, firebaseUID, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Usuario registrado correctamente.',
            user: {
                email: email,
                id: firebaseUID
            }
        });
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
        const [results] = await pool.query('SELECT * FROM owners WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado.' });
        }

        const user = results[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

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

// PARTE DE VIKI

// Ruta para gestionar tarjetas
app.post('/tarjetas', upload.single('image'), async (req, res) => {
    const { title, subtitle, content, owner_id } = req.body;
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '';
  
    if (!title || !subtitle || !content || !owner_id || !req.file) {
      return res.status(400).json({ message: 'Faltan datos necesarios para agregar la tarjeta' });
    }
  
    try {
      const query = 'INSERT INTO tarjetas (title, subtitle, content, imageUrl, owner_id) VALUES (?, ?, ?, ?, ?)';
      const [result] = await pool.query(query, [title, subtitle, content, imageUrl, owner_id]);
  
      res.status(201).json({ id: result.insertId, title, subtitle, content, imageUrl, owner_id });
    } catch (err) {
      console.error('Error al agregar tarjeta:', err);
      res.status(500).send('Error al agregar tarjeta');
    }
});

app.get('/tarjetas', async (req, res) => {
    try {
        console.log("Solicitud para obtener tarjetas recibida");
        const [tarjetas] = await pool.query('SELECT * FROM tarjetas');
        console.log(tarjetas); // Verificar datos obtenidos
        res.json(tarjetas);
    } catch (err) {
        console.error('Error al obtener tarjetas:', err);
        res.status(500).send('Error al obtener tarjetas');
    }
});

// Rutas para gestionar usuarios por ID
app.get('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [usuarios] = await pool.query('SELECT * FROM owners WHERE id = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(usuarios[0]);
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).send('Error al obtener usuario');
    }
});

app.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido1, apellido2, direccion } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE owners SET nombre = ?, apellido1 = ?, apellido2 = ?, direccion = ? WHERE id = ?',
            [nombre, apellido1, apellido2, direccion, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).send('Error al actualizar usuario');
    }
});

app.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM owners WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).send('Error al eliminar usuario');
    }
});

// Rutas para gestionar mascotas por ID
app.get('/mascotas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [mascotas] = await pool.query('SELECT * FROM mascotas WHERE id = ?', [id]);
        if (mascotas.length === 0) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        res.json(mascotas[0]);
    } catch (err) {
        console.error('Error al obtener mascota:', err);
        res.status(500).send('Error al obtener mascota');
    }
});

app.put('/mascotas/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo_mascota, descripcion } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE mascotas SET nombre = ?, tipo_mascota = ?, descripcion = ? WHERE id = ?',
            [nombre, tipo_mascota, descripcion, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        res.status(200).json({ message: 'Mascota actualizada correctamente' });
    } catch (err) {
        console.error('Error al actualizar mascota:', err);
        res.status(500).send('Error al actualizar mascota');
    }
});

app.delete('/mascotas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM mascotas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        res.status(200).json({ message: 'Mascota eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar mascota:', err);
        res.status(500).send('Error al eliminar mascota');
    }
});

// PARTE DE WEBSOCKETS PARA EL CHAT

const http = require('http');
const { Server } = require('socket.io');

// Crear el servidor HTTP para usar tanto Express como Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:8100",
        methods: ["GET", "POST"]
    }
});

// Socket.IO - Evento para enviar mensajes
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
  
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Usuario ${socket.id} se unió al chat ${chatId}`);
    });
  
    socket.on('send_message', async (data) => {
        const { chatId, sender_id, content, receiver_id } = data;
      
        try {
          // Verificar si ya existe un chat entre estos dos usuarios
          let [existingChat] = await pool.query(
            'SELECT * FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [sender_id, receiver_id, receiver_id, sender_id]
          );
      
          // Si el chat no existe, crearlo
          if (existingChat.length === 0) {
            console.log('El chat no existe, creando un nuevo chat...');
            if (!receiver_id) {
              console.error('Error: receiver_id no está definido');
              return;
            }
            const [newChat] = await pool.query(
              'INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)',
              [sender_id, receiver_id]
            );
            data.chatId = newChat.insertId;
          } else {
            data.chatId = existingChat[0].id; // Usar el id del chat existente
          }
      
          // Insertar el mensaje en la base de datos usando el chatId
          const [result] = await pool.query(
            'INSERT INTO mensajes (chat_id, sender_id, content) VALUES (?, ?, ?)',
            [data.chatId, sender_id, content]
          );
      
          if (result.affectedRows > 0) {
            // Emitir el mensaje a todos los usuarios en el chat
            const newMessage = {
              id: result.insertId,
              chatId: data.chatId,
              sender_id,
              content,
              timestamp: new Date().toISOString(),
            };
            io.to(data.chatId).emit('receive_message', newMessage);
          } else {
            console.error('No se pudo insertar el mensaje en la base de datos.');
          }
        } catch (error) {
          console.error('Error al insertar el mensaje:', error);
        }
      });      
  
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
});

// Ruta para obtener todos los chats en los que el usuario actual esté involucrado
app.get('/chats/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        console.log('Recibida solicitud para obtener chats del usuario:', userId);
        const [chats] = await pool.query(
            'SELECT * FROM chats WHERE user1_id = ? OR user2_id = ?',
            [userId, userId]
        );
        console.log('Resultado de la consulta:', chats);

        if (chats.length > 0) {
            res.status(200).json(chats);
        } else {
            res.status(404).json({ message: 'No se encontraron chats para este usuario.' });
        }
    } catch (error) {
        console.error('Error al obtener los chats:', error);
        res.status(500).json({ error: 'Error al obtener los chats.' });
    }
});

// Ruta para buscar chats
app.get('/chats/find/:userId/:receiverId', async (req, res) => {
    const { userId, receiverId } = req.params;
  
    try {
      const [chats] = await pool.query(
        'SELECT * FROM chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
        [userId, receiverId, receiverId, userId]
      );
  
      if (chats.length > 0) {
        res.status(200).json({ chatId: chats[0].id });
      } else {
        res.status(404).json({ message: 'No se encontró un chat existente' });
      }
    } catch (err) {
      console.error('Error al buscar chat:', err);
      res.status(500).send('Error al buscar chat');
    }
  });  

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejador para cerrar el servidor correctamente al recibir señal de interrupción (Ctrl + C)
process.on('SIGINT', () => {
    console.log("Cerrando servidor...");
    server.close(() => {
        console.log("Servidor cerrado.");
        process.exit(0);
    });
});