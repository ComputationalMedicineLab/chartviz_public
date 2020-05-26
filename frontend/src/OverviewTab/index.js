import React from 'react';
import head from 'lodash/head';
import last from 'lodash/last';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import { scaleTime } from 'd3-scale';
import { timeYear, timeMonth, timeDay } from 'd3-time';
import { timeFormat } from 'd3-time-format';

import AllergyTable from './AllergyTable';
import LatestVitalsTable from './LatestVitalsTable';
import ProblemList from './ProblemList';
import RecentLabs from './RecentLabs';
import RecentMeds from './RecentMeds';

import LabOrders from '../LabOrders';

import { AfterLoad, slugify, titlecase } from '../utils';
import { createCondition, fetchOverviewTab } from '../api';
import { PatientCtx } from '../contexts';

export default class OverviewTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = { showVitals: false };
    this.toggleVitals = this.toggleVitals.bind(this);
    this.renderJSX = this.renderJSX.bind(this);
  }

  toggleVitals() {
    this.setState({ showVitals: !this.state.showVitals });
  }

  renderJSX({ labs, labRange, phecodes, meds, medRange, vitals, dategrid }) {
    const patient = this.context;
    const { history } = this.props;
    const X = scaleTime()
      .domain([
        timeYear(head(dategrid)),
        timeDay.ceil(last(dategrid))
      ])
      .nice()
      .range([0, 940]);

    let name = patient.first_name || '';
    if (patient.middle_name) name += ` ${patient.middle_name}`;
    if (patient.last_name)   name += ` ${patient.last_name}`;
    name = titlecase(name);

    return (
      <article id='overview'>
        <section id='overview-main'>
          <div id='overview-title' className='article-header'>
            <h3 style={{ flex: 1 }}>
              <span id='patient-name' onClick={this.toggleVitals}>
                { name }
              </span>
            </h3>
            <Popover
              trigger='focus'
              placement='right'
              target='patient-name'
              isOpen={this.state.showVitals}
              toggle={this.toggleVitals}
            >
              <PopoverHeader>
                Vitals / Demographics
              </PopoverHeader>
              <PopoverBody>
                <LatestVitalsTable vitals={vitals} patient={patient} />
              </PopoverBody>
            </Popover>
            <span>
              <span><a href="https://medical-dictionary.thefreedictionary.com/code+status">Code Status</a> | </span>
              <span>BP: { vitals.blood_pressure || 'N/A' } | </span>
              <span>HR: { vitals.pulse || 'N/A' } | </span>
              <span>RR: { vitals.resp  || 'N/A' } | </span>
              <span>{ patient.mrn }</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
            <div style={{
              borderRight: '1px solid gray',
              flex: 1,
              display: 'flex',
              flexFlow: 'column nowrap',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <AllergyTable />
              </div>
              <div style={{ flex: 1 }}>
                <RecentMeds
                  meds={meds}
                  onClick={name => history.push(`/${patient.id}/meds#${slugify(name)}`)}
                />
              </div>
            </div>
            <div style={{ marginRight: '2rem', flex: 1 }}>
              <LabOrders
                labs={labs}
                onClick={code => history.push(`/${patient.id}/labs#${slugify(code)}`)}
              />
            </div>
          </div>
        </section>

        <section id='overview-problems'>
          <div className='section-header'>
            <h5>
              Problems
            </h5>
          </div>
          <ProblemList
            X={X}
            phecodes={phecodes}
            onClick={
              phecode => createCondition(patient.id, phecode.id)
                .then(patient.updateTabs)
                .then(() => history.push(`/${patient.id}/phecodes/${phecode.id}`))
            }
          />
        </section>

        <section id='overview-labs'>
          <div className='section-header'>
            <h5>
              Recent Labs ({labRange[0]} to {labRange[1]})
            </h5>
          </div>
          <RecentLabs
            labs={labs}
            onClick={code => history.push(`/${patient.id}/labs#${slugify(code)}`)}
          />
        </section>
      </article>
    );
  }

  render() {
    return (
      <AfterLoad
        loader={() => fetchOverviewTab(this.context)}
        reloadkey={this.context.id}
      >
        { this.renderJSX }
      </AfterLoad>
    );
  }
}
