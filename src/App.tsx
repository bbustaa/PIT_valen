import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Login from './Login'; 
import Register from './Registro';
import CompleteProfile from './CompleteProfile';
import AddPet from './AddPet'; 
import { useEffect, useState } from 'react';

/* Ionic CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [isUserRegistered, setIsUserRegistered] = useState(!!localStorage.getItem('userEmail'));
  const [isProfileComplete, setIsProfileComplete] = useState(!!localStorage.getItem('id_owner') || !!localStorage.getItem('id'));


  // Actualizamos el estado al cambiar el almacenamiento local
  useEffect(() => {
    const handleStorageChange = () => {
      setIsUserRegistered(!!localStorage.getItem('email'));
      setIsProfileComplete(!!localStorage.getItem('id') || !!localStorage.getItem('id_owner'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Ruta de Login */}
          <Route exact path="/login">
            {isUserRegistered ? <Redirect to={isProfileComplete ? "/home" : "/complete-profile"} /> : <Login />}
          </Route>

          {/* Ruta de Registro */}
          <Route exact path="/register">
            {isUserRegistered ? <Redirect to="/complete-profile" /> : <Register />}
          </Route>

          {/* Ruta para Completar Perfil */}
          <Route exact path="/complete-profile">
            {isUserRegistered ? (
              isProfileComplete ? <Redirect to="/home" /> : <CompleteProfile />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          <Route exact path="/add-pet">
            {isProfileComplete ? <AddPet /> : <Redirect to="/complete-profile" />}
          </Route>

          <Route exact path="/home">
            {isProfileComplete ? <Home /> : <Redirect to="/complete-profile" />}
          </Route>

          {/* Ruta raíz que redirige a Login */}
          <Route exact path="/">
            <Redirect to="/login" /> {/* Redirigir a la pantalla de login al iniciar */}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
