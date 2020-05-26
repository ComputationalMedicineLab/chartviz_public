/**
 * Provides the frontend router, the user context, and switches on the two
 * basic pages - select a patient, or view a patient.
 */
import React from 'react';
import { Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

import DetailPage from './pages/Detail';
import SelectPage from './pages/Select';

import { fetchUser } from './api';
import { UserCtx } from './contexts';
import { AfterLoad } from './utils';

export default class App extends React.PureComponent {
  render() {
    return (
      <AfterLoad loader={fetchUser}>
        {user =>
          <BrowserRouter>
            <UserCtx.Provider value={user}>
              <Route exact path='/' component={SelectPage} />
              <Route path='/:id' component={DetailPage} />
            </UserCtx.Provider>
          </BrowserRouter>
        }
      </AfterLoad>
    );
  }
}
