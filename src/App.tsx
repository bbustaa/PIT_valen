import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Login from './Login'; 
import Register from './Registro';
import CompleteProfile from './CompleteProfile';
import AddPet from './AddPet'; 

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
  const isUserRegistered = !!localStorage.getItem('userEmail');  // Verifica si el usuario está registrado
  const isProfileComplete = !!localStorage.getItem('id_owner');  // Verifica si el perfil está completo

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Ruta de Login */}
          <Route exact path="/login">
            {isUserRegistered ? <Redirect to="/complete-profile" /> : <Login />}
          </Route>

          {/* Ruta de Registro */}
          <Route exact path="/register">
            {isUserRegistered ? <Redirect to="/complete-profile" /> : <Register />}
          </Route>

          {/* Ruta para Completar Perfil */}
          <Route exact path="/complete-profile">
            {isUserRegistered ? (
              isProfileComplete ? <Redirect to="/add-pet" /> : <CompleteProfile />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/* Ruta para Añadir Mascotas */}
          <Route exact path="/add-pet">
            {isProfileComplete ? <AddPet /> : <Redirect to="/complete-profile" />}
          </Route>

          {/* Ruta para el Home */}
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
