import React, { useState, useEffect, FC } from "react";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast
} from "@ionic/react";
import { useHistory } from 'react-router-dom';

const CompleteProfile: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || "");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const history = useHistory();

  useEffect(() => {
    console.log("Componente CompleteProfile montado"); 
    if (!email) {
      history.push('/register');
    }
  }, [email, history]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Enviando datos de perfil:", { firstName, lastName1, lastName2, address, email });
  
    try {
      const response = await fetch("http://localhost:5000/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName1,
          lastName2,
          address,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Error al guardar el perfil.");
      }
  
      const result = await response.json();
      localStorage.setItem('id_owner', result.id_owner.toString());
  
      // Aquí también guardamos los otros datos de perfil en el localStorage
      localStorage.setItem('nombre', firstName);
      localStorage.setItem('apellido1', lastName1);
      localStorage.setItem('apellido2', lastName2);
      localStorage.setItem('direccion', address);
  
      console.log("Perfil guardado exitosamente. ID del propietario:", result.id_owner);
      history.push('/add-pet');  // Redirige a la página de añadir mascotas
      // Refrescar la página después de la redirección
      window.location.reload();
  
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      setToastMessage("Hubo un error al guardar el perfil.");
      setShowToast(true);
    }
  };
  

  return (
    <IonPage>
      <IonContent style={styles.content}>
        <div style={styles.cardContainer}>
          <IonCard style={styles.card}>
            <IonCardHeader>
              <IonCardTitle>Completar Perfil</IonCardTitle>
            </IonCardHeader>
            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
              <IonItem>
                <IonLabel position="floating">Nombre</IonLabel>
                <IonInput
                  type="text"
                  value={firstName}
                  onIonChange={(e: any) => setFirstName(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Apellido 1</IonLabel>
                <IonInput
                  type="text"
                  value={lastName1}
                  onIonChange={(e: any) => setLastName1(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Apellido 2</IonLabel>
                <IonInput
                  type="text"
                  value={lastName2}
                  onIonChange={(e: any) => setLastName2(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Dirección</IonLabel>
                <IonInput
                  type="text"
                  value={address}
                  onIonChange={(e: any) => setAddress(e.target.value)}
                  required
                />
              </IonItem>

              <IonButton
                type="submit"
                expand="full"
                style={{ marginTop: "20px" }}
                color="primary"
              >
                Guardar Perfil
              </IonButton>
            </form>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage || undefined}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

const styles = {
  content: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5dc',
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '20px',
  },
  card: {
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
};

export default CompleteProfile;
