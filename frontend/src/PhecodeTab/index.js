import React from 'react';
import head from 'lodash/head';
import last from 'lodash/last';
import { Redirect } from 'react-router-dom';
import { Card, CardHeader, CardBody } from 'reactstrap';
import { scaleTime } from 'd3-scale';
import { timeYear, timeDay } from 'd3-time';

import { AfterLoad } from '../utils';
import ThresholdSlider from '../ThresholdSlider';
import PhecodeICDs from './PhecodeICDs';
import MedicationTable from '../meds/MedicationTable';
import LabChartTable from '../labs/LabChartTable';
import { createCondition, fetchConditionTab } from '../api';
import { PatientCtx } from '../contexts';

export default class PhecodeTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = { threshold: 0.5, detail: null };
    this.toggleDetail = this.toggleDetail.bind(this);
    this.aboveThreshold = this.aboveThreshold.bind(this);
    this.renderJSX = this.renderJSX.bind(this);
    this.load = this.load.bind(this);
  }

  async load() {
    const { match, conditions } = this.props;
    const tabSettings = this.context.tabspecs
      .find(ts => ts.condition.id  == match.params.ph);
    const phecode = tabSettings.condition;
    const threshold = tabSettings.threshold;
    // Assume we've arrived by direct URL and try to add the phecode to
    // tabspec if we can
    if (!phecode) {
      try {
        // If the phecode doesn't exist we need to fail somehow here
        const resp = await createCondition(this.context.id, match.params.ph);
        this.context.updateTabs(resp);
      } catch (error) {
        console.dir(error);
        return ;
      }
    }
    // Load up condition data from phecode
    const resp = await fetchConditionTab(this.context, phecode.id);
    return {...resp, phecode};
  }

  toggleDetail(detail) {
    if (detail === this.state.detail)
      detail = null;
    this.setState({ detail });
  }

  aboveThreshold({ relevance }) {
    return relevance >= this.state.threshold;
  }

  renderJSX({ phecode, dategrid, intensity, baseIcds, extraIcds, labs, meds }) {
    const X = scaleTime()
      .domain([
        timeYear(head(dategrid)),
        timeDay(last(dategrid))
      ])
      .nice()
      .range([0, 940]);

    const title = `${phecode.code}\u2013${phecode.description}`;
    const extra = extraIcds.filter(this.aboveThreshold);

    // CBC and CHEM internally sorted and not filtered by relevance
    // Other filtered and sorted by relevance
    labs.other = labs.other
      .filter(this.aboveThreshold)
      .sort((A, B) => B.relevance - A.relevance);

    meds = meds.filter(this.aboveThreshold);

    return (
      <article id='condition'>
        <section id='condition-overview'>
          <div className='article-header'>
            <h4>
              { title }
            </h4>
          </div>
          <ThresholdSlider
            initialValue={this.state.threshold}
            onChangeComplete={threshold => {
              this.setState({ threshold }, () => {
                createCondition(this.context.id, phecode.id, threshold)
                  .then(this.context.updateTabs);
                // No need to push history, we're already here.
              });
            }}
          />
          <div>
            <div>Extra ICDS: { extra.length }</div>
            <div>Labs (other): { labs.other.length }</div>
            <div>Meds: { meds.length }</div>
          </div>
        </section>

        <section id='condition-icds'>
          <div className='section-header'>
            <h5>ICD Codes</h5>
          </div>
          <div>
            <PhecodeICDs
              dategrid={dategrid}
              intensity={intensity}
              base={baseIcds}
              extra={extra}
              X={X}
              onClick={ phecodeId => {
                const { history } = this.props;
                createCondition(this.context.id, phecodeId)
                  .then(this.context.updateTabs)
                  .then(() => history.push(`/${this.context.id}/phecodes/${phecodeId}`))
              }}
            />
          </div>
        </section>

        <section id='condition-labs'>
          <div className='section-header'>
            <h5>Relevant Labs</h5>
          </div>
          <div>
            <LabChartTable
              X={X}
              labs={labs}
              detail={this.state.detail}
              setDetail={this.toggleDetail}
            />
          </div>
        </section>

        <section id='condition-meds'>
          <div className='section-header'>
            <h5>Relevant Meds</h5>
          </div>
          <div>
            <MedicationTable
              X={X}
              meds={meds}
              detail={this.state.detail}
              toggleDetail={this.toggleDetail}
            />
          </div>
        </section>
      </article>
    );
  }

  render() {
    const {id, ph} = this.props.match.params;
    return (
      <AfterLoad
        loader={this.load}
        reloadkey={`${id}${ph}`}
      >
        { this.renderJSX }
      </AfterLoad>
    );
  }
}
