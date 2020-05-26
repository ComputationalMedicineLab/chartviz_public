import React from 'react';
import * as moment from 'moment';
import last from 'lodash/last';

import BmiChart from './BmiChart';
import BloodPressureChart from './BloodPressureChart';
import HeartRateChart from './HeartRateChart';
import { fetchVitalsTab } from './api';

import { AfterLoad } from './utils';
import { PatientCtx } from './contexts';


export default class VitalsTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = { timeframe: 'month' };
    this.renderJSX = this.renderJSX.bind(this);
  }

  renderJSX({bloodPressure, heartRate, respiratoryRate, bmi}) {
    const lastbp = last(bloodPressure);
    const lastpulse = last(heartRate);
    const lastresp = last(respiratoryRate);
    const lastbmi = last(bmi);

    return (
      <article id='vitals'>
        <div>
          <form>
            <label className='radio-label'>
              <input type="radio" value="all"
                checked={this.state.timeframe === 'all'}
                onChange={() => this.setState({ timeframe: 'all' })}
              />
              All Time
            </label>
            <label className='radio-label'>
              <input type="radio" value="year"
                checked={this.state.timeframe === 'year'}
                onChange={() => this.setState({ timeframe: 'year' })}
              />
              Past Year
            </label>
            <label className='radio-label'>
              <input type="radio" value="month"
                checked={this.state.timeframe === 'month'}
                onChange={() => this.setState({ timeframe: 'month' })}
              />
              Past Month
            </label>
          </form>
        </div>

        <section>
          <div className='section-header'>
            <h5 style={{ display: 'inline-block', marginRight: '1rem' }}>Blood Pressure</h5>
            <span title='Latest Value' style={{ fontSize: '0.75rem', marginRight: '1rem' }}>
              { lastbp && <strong>{ lastbp.systolic }/{ lastbp.diastolic }</strong> }
              {" "}
              { lastbp && `(${lastbp.date.format('YYYY-MM-DD HH:mm:ss')})` }
            </span>
            <label>
              <input type='checkbox'
                value={this.state.showPulse}
                onChange={() => this.setState({ showPulse: !this.state.showPulse })}
              />
              Show Pulse
            </label>
          </div>
          <BloodPressureChart
            timeframe={this.state.timeframe}
            showPulse={this.state.showPulse}
            pulse={heartRate}
            bloodPressure={bloodPressure}
          />
        </section>

        <section>
          <div className='section-header'>
            <h5 style={{ display: 'inline-block', marginRight: '1rem' }}>
              Heart Rate / Resp. Rate
            </h5>
            <span title='Latest Value' style={{ fontSize: '0.75rem', marginRight: '1rem' }}>
              { lastpulse && <strong>HR: { lastpulse.value }</strong> }
              {" "}
              { lastpulse && `(${lastpulse.date.format('YYYY-MM-DD HH:mm:ss')})` }
            </span>
            <span title='Latest Value' style={{ fontSize: '0.75rem', marginRight: '1rem' }}>
              { lastresp && <strong>RR: { lastresp.value }</strong> }
              {" "}
              { lastresp && `(${lastresp.date.format('YYYY-MM-DD HH:mm:ss')})` }
            </span>
          </div>
          <HeartRateChart
            timeframe={this.state.timeframe}
            pulse={heartRate}
            respRt={respiratoryRate}
          />
        </section>

        <section>
          <div className='section-header'>
            <h5 style={{ display: 'inline-block', marginRight: '1rem' }}>
              BMI
            </h5>
            <span title='Latest Value' style={{ fontSize: '0.75rem' }}>
              { lastbmi && <strong>{ lastbmi.bmi }</strong> }
              {" "}
              { lastbmi && `(${lastbmi.date.format('YYYY-MM-DD HH:mm:ss')})` }
            </span>
          </div>
          <BmiChart bmi={bmi} />
        </section>
      </article>
    );
  }

  render() {
    return (
      <AfterLoad
        loader={() => fetchVitalsTab(this.context)}
        reloadkey={() => this.context.id}
      >
        { this.renderJSX }
      </AfterLoad>
    );
  }
}
