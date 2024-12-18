import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel } from '@ionic/react';

interface AddCardFormProps {
  onAddCard: (title: string, subtitle: string, content: string, imageUrl: string) => void;
  onClose: () => void; // Añadir una función para manejar el cierre del modal
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onAddCard, onClose }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Obtener el id_owner desde el localStorage
  const id_owner = localStorage.getItem('id');

  // Añadir un console.log para verificar que id_owner está disponible
  console.log('ID del dueño obtenido desde localStorage:', id_owner);

  const handleAddCard = async () => {
    if (title && subtitle && content && imageFile && id_owner) {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subtitle', subtitle);
        formData.append('content', content);
        formData.append('owner_id', id_owner);
        formData.append('image', imageFile);
  
        const response = await fetch('http://localhost:5000/tarjetas', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Error en la respuesta de la API');
        }
  
        const data = await response.json();
        if (data.id) {
          onAddCard(title, subtitle, content, `http://localhost:5000${data.imageUrl}`); // Asegúrate de usar la URL completa
          setTitle('');
          setSubtitle('');
          setContent('');
          setImageFile(null);
          onClose(); // Cerrar el modal después de agregar la tarjeta
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error al agregar tarjeta:', error);
      }
    } else {
      console.error('Todos los campos son requeridos');
    }
  };
  

  return (
    <>
      <IonItem>
        <IonLabel position="floating">Card Title</IonLabel>
        <IonInput value={title} onIonChange={(e) => setTitle(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Card Subtitle</IonLabel>
        <IonInput value={subtitle} onIonChange={(e) => setSubtitle(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Card Content</IonLabel>
        <IonInput value={content} onIonChange={(e) => setContent(e.detail.value!)} />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Image File</IonLabel>
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setImageFile(e.target.files[0]);
            }
          }}
        />
      </IonItem>
      <IonButton expand="full" onClick={handleAddCard}>
        Add Card
      </IonButton>
      <IonButton expand="full" color="medium" onClick={onClose}>
        Cancel
      </IonButton>
    </>
  );
};

export default AddCardForm;