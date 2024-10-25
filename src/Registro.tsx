import React, { useState } from "react";
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
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setShowToast(true);
      return;
    }

    try {
      // Registrar en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUID = userCredential.user.uid;
      console.log("Usuario registrado con Firebase:", firebaseUID);

      // Enviar el UID y el email al backend para almacenarlo en MySQL
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firebaseUID })
      });

      if (!response.ok) {
        throw new Error("Error al registrar el usuario en el servidor");
      }

      console.log("Usuario registrado con éxito en el servidor");

      // Redirigir al perfil completo
      history.push('/complete-profile');
      window.location.reload();
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      setErrorMessage('Hubo un error al registrar el usuario.');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonContent style={styles.content}>
        <div style={styles.cardContainer}>
          <IonCard style={styles.card}>
            <IonCardHeader>
              <IonCardTitle>Registrar Usuario</IonCardTitle>
            </IonCardHeader>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              {errorMessage && (
                <IonToast
                  isOpen={showToast}
                  onDidDismiss={() => setShowToast(false)}
                  message={errorMessage}
                  duration={2000}
                />
              )}
              <IonItem>
                <IonLabel position="floating">Correo Electrónico</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonChange={(e: any) => setEmail(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Contraseña</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e: any) => setPassword(e.target.value)}
                  required
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Repetir Contraseña</IonLabel>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonChange={(e: any) => setConfirmPassword(e.target.value)}
                  required
                />
              </IonItem>
              <IonButton
                type="submit"
                expand="full"
                style={{ marginTop: "20px" }}
                color="primary"
              >
                Registrar
              </IonButton>
            </form>
          </IonCard>
        </div>
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

export default Register;
