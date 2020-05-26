/**
 * Provides a dropdown for selecting a patient to view
 */
import React from 'react';
import AsyncSelect from 'react-select/lib/Async';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from 'reactstrap';
import { Icon } from 'react-icons-kit'
import { search } from 'react-icons-kit/fa/search';

import { searchPatients } from '../api';
import { titlecase } from '../utils';
import { UserCtx } from '../contexts';


export default class SelectPage extends React.Component {
  static contextType = UserCtx;

  constructor(props) {
    super(props);
    this.state = {value: ''};
    this.search = this.search.bind(this);
    this.select = this.select.bind(this);
    this.toLabel = this.toLabel.bind(this);
  }

  toLabel({mrn, first_name, middle_name, last_name}) {
    return `${mrn} | ${first_name} ${middle_name} ${last_name}`;
  }

  search(value) {
    return searchPatients(value)
      .then(data => {
        this.setState({...data});
        return data.results.map(item => ({value: item, label: this.toLabel(item)}));
      });
  }

  select({value: patient}) {
    this.props.history.push(`/${patient.id}`);
  }

  render() {
    return (
      <div>
        <Navbar light color='light' expand='md'
          style={{ display: 'flex', justifyContent: 'space-between'}}
        >
          <NavbarBrand href="/">
            ChartViz
          </NavbarBrand>
          <Nav navbar >
            <NavItem>
              <NavLink href='/accounts/logout/'>
                {`Logout ${titlecase(this.context.username)}`}
              </NavLink>
            </NavItem>
          </Nav>
        </Navbar>
        <div style={{ margin: '6vh 12vw' }}>
          <h3>Please Select Patient</h3>
          <AsyncSelect
            defaultOptions
            styles={{
              container: (base, state) => ({
                ...base,
                flex: 1,
              })
            }}
            placeholder={
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Icon icon={search} />
                <span style={{ paddingLeft: '1ch' }}>
                  Search Patients
                </span>
              </div>
            }
            loadOptions={this.search}
            onChange={this.select}
          />
        </div>
      </div>
    );
  }
}
