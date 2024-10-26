import React from 'react';

// Definir la interfaz para el mensaje
interface Message {
    sender_id: string;
    content: string;
}

interface ChatProps {
    chatId: string;
    currentUserId: string;
}

const Chat: React.FC<ChatProps> = ({ chatId, currentUserId }) => {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [newMessage, setNewMessage] = React.useState('');

    // Renderizado de mensajes
    return (
        <div>
            <h2>Chat</h2>
            <div className="messages">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={message.sender_id === currentUserId ? 'my-message' : 'other-message'}
                    >
                        {message.content}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
            />
            <button onClick={() => {}}>Enviar</button>
        </div>
    );
};

export default Chat;
