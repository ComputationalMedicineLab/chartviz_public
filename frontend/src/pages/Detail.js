import React from 'react';
import { RingLoader } from 'react-spinners';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';
import { Link, Route, Switch } from 'react-router-dom';
import { Icon } from 'react-icons-kit';
import { remove } from 'react-icons-kit/fa/remove';

import CptsTab from '../CptsTab';
import LabsTab from '../LabsTab';
import MedsTab from '../MedsTab';
import OverviewTab from '../OverviewTab';
import PhecodeTab from '../PhecodeTab';
import SystemsTab from '../SystemsTab';
import VitalsTab from '../VitalsTab';

import CodeAutocomplete from '../CodeAutocomplete';
import { UserCtx, PatientCtx } from '../contexts';
import { titlecase } from '../utils';
import { deleteCondition, fetchPatient, listConditions } from '../api';

import '../styles/Detail.css';

/*
 * A stylish tab link, rendered in the tab nav.
 */
class TabLink extends React.Component {
  render() {
    const { to, exact, children } = this.props;
    return (
      <Route exact={exact} path={to}>
        {({ match }) => (
          <NavItem>
            {/* NavLink is required for the 'tab' styling */}
            <NavLink tag='div' className={match && 'active'}>
              <Link
                to={to}
                className='tablink'
                style={{ color: `rgba(0, 0, 0, ${match ? 0.7 : 0.5}` }}
              >
                { children }
              </Link>
            </NavLink>
          </NavItem>
        )}
      </Route>
    );
  }
}
/*
 * State container and provider for patient context - this also provides a hook
 * for descendents to update what condition tabs exist
 */
class WithPatient extends React.Component {
  state = { loading: true };
  load = () => {
    this.setState({ loading: true }, async () => {
      const { id } = this.props;
      const patientRaw = await fetchPatient(id);
      const extraTabs = await listConditions(id);
      const patient = {
        ...patientRaw,
        ...extraTabs,
        updateTabs: newtabs => {
          const patient = {...this.state.patient, ...newtabs};
          this.setState({ patient });
          return patient;
        }
      };
      this.setState({ loading: false, patient });
    });
  }
  componentDidMount() {
    this.load();
  }
  componentDidUpdate(props) {
    if (this.props.id !== props.id)
      this.load();
  }
  render() {
    if (this.state.loading) {
      return (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <RingLoader color='#36D7B7' />
        </div>
      );
    }

    return (
      <PatientCtx.Provider value={this.state.patient}>
        { this.props.children }
      </PatientCtx.Provider>
    );
  }
}
/**
 * Manages the routing of the detail view tabbed pages and instantiates both
 * navigations (the main nav and the tab nav)
 */
export default class DetailPage extends React.Component {
  static contextType = UserCtx;
  render() {
    const { match, history } = this.props;
    const url = match.url.replace(/\/$/, "");
    return (
      <WithPatient id={+match.params.id}>
        {/* Main Navigation */}
        <div id='pageheader-sticky'>
          <Navbar light color='light' expand='md' style={{ display: 'flex' }}>
            <div id='pageheader-left'>
              <NavbarBrand href="/">ChartViz</NavbarBrand>
            </div>
            <div id='pageheader-right'>
              <div style={{ flex: 1 }}>
                <CodeAutocomplete match={match} history={history} />
              </div>
              <Nav navbar >
                <NavItem>
                  <NavLink href='/accounts/logout/'>
                    Logout {titlecase(this.context.username)}
                  </NavLink>
                </NavItem>
              </Nav>
            </div>
          </Navbar>
        </div>
        {/* Tabs Navigation */}
        <Nav tabs id='tabbar'>
          <TabLink exact to={url}>Overview</TabLink>
          <TabLink to={`${url}/systems`}>Systems</TabLink>
          <TabLink to={`${url}/labs`}>Labs</TabLink>
          <TabLink to={`${url}/meds`}>Meds</TabLink>
          <TabLink to={`${url}/vitals`}>Vitals</TabLink>
          <TabLink to={`${url}/cpts`}>Procedures</TabLink>
          <PatientCtx.Consumer>
            {
              patient => patient.tabspecs
                .map(c => c.condition)
                .map(({ id, code, description }) =>
                  <TabLink key={id} to={`${url}/phecodes/${id}`}>
                    <Icon
                      icon={remove}
                      onClick={() => deleteCondition(patient.id, id)
                          .then(patient.updateTabs)
                          .then(() => history.push(`/${patient.id}`))
                      }
                    />
                    {code}{'\u2013'}{description}
                  </TabLink>
                )
            }
          </PatientCtx.Consumer>
        </Nav>
        {/* Page content / main view */}
        <div style={{ margin: '1vh 1vw' }}>
          <Switch>
            <Route exact path='/:id'        component={OverviewTab} />
            <Route path='/:id/systems'      component={SystemsTab} />
            <Route path='/:id/labs'         component={LabsTab} />
            <Route path='/:id/meds'         component={MedsTab} />
            <Route path='/:id/vitals'       component={VitalsTab} />
            <Route path='/:id/cpts'         component={CptsTab} />
            <Route path='/:id/phecodes/:ph' component={PhecodeTab} />
          </Switch>
        </div>
      </WithPatient>
    );
  }
}
