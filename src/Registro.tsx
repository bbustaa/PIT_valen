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

const Register: React.FC = () => {
  const history = useHistory(); // Inicializar useHistory
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null); 
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setShowToast(true);
      return;
    }

    try {
      console.log("Iniciando el registro del usuario...");

      // Enviar solicitud POST para registrar el usuario
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (response.ok) {
        console.log("Usuario registrado correctamente, redirigiendo a /complete-profile");

        // Guardar el email en localStorage
        localStorage.setItem('userEmail', email);

        // Redirigir a /complete-profile
        history.push('/complete-profile');

        // Refrescar la página después de la redirección
        window.location.reload();
      } else {
        setErrorMessage(data.message || 'Error al registrar el usuario.');
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      setErrorMessage('Error al conectar con el servidor.');
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
                <p style={{ color: "red", textAlign: "center" }}>{errorMessage}</p>
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

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={errorMessage || undefined}
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

export default Register;
