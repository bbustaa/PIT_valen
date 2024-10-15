import React, { ComponentType } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

// Definir las propiedades que acepta PrivateRoute
interface PrivateRouteProps extends RouteProps {
  component: ComponentType<any>;  // Tipo explícito para el componente
  condition: boolean;             // Condición para la ruta privada
  redirectPath: string;           // Ruta de redirección si la condición no se cumple
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, condition, redirectPath, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        condition ? <Component {...props} /> : <Redirect to={redirectPath} />
      }
    />
  );
};

export default PrivateRoute;
