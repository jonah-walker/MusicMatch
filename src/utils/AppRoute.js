import React from 'react';
import { Route } from 'react-router-dom';
import Testimonial from '../components/sections/Testimonial';

const AppRoute = ({
  component: Component,
  layout: Layout,
  ...rest
}) => {

  Layout = (Layout === undefined) ? props => (<>{props.children}</>) : Layout;

  return (
      <Route path="/musicmatch" component={Testimonial} exact />,
      <Route
      {...rest}
      render={props => (
        <Layout>
          <Component {...props} />
        </Layout>
      )}
      />
  );
}

export default AppRoute;