import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Chat = ({ chatId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Cargar mensajes al iniciar
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/mensajes/${chatId}`);
        setMessages(response.data); // Si es un chat nuevo, response.data será una lista vacía
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      }
    };
    fetchMessages();
  }, [chatId]);

  // Manejar el envío de mensajes
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return; // Evitar enviar mensajes vacíos

    const messageData = {
      chatId,
      sender_id: currentUserId,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    // Enviar el mensaje al servidor WebSocket y a la base de datos
    socket.emit('send_message', messageData);

    // Agregar el mensaje localmente
    setMessages([...messages, messageData]);
    setNewMessage('');
  };

  return (
    <div>
      <h2>Chat</h2>
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className={message.sender_id === currentUserId ? 'my-message' : 'other-message'}>
              {message.content}
            </div>
          ))
        ) : (
          <p>No hay mensajes en este chat. Sé el primero en decir algo!</p>
        )}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={handleSendMessage}>Enviar</button>
    </div>
  );
};

export default Chat;
