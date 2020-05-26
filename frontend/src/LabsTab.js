/**
 * Table of labs and values
 */
import React from 'react';
import * as moment from 'moment';
import head from 'lodash/head';
import last from 'lodash/last';
import { scaleTime } from 'd3-scale';

import LabChartTable from './labs/LabChartTable';
import { fetchLabsTab } from './api';
import { AfterLoad, slugify } from './utils';

import { PatientCtx } from './contexts';

function getX(dates, timeframe) {
  // The moment constructor clones existing moment objects
  // .subtract mutates the original moment
  const hi = moment(last(dates));
  let lo = moment(head(dates));
  if (timeframe === 'month')
    lo = hi.clone().subtract(1, 'months');
  else if (timeframe === 'year')
    lo = hi.clone().subtract(1, 'years');
  return scaleTime().domain([lo, hi]).nice().range([0, 940]);
}

export default class LabsTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = { timeframe: 'year', detail: null };
    this.handleHash = this.handleHash.bind(this);
    this.renderJSX = this.renderJSX.bind(this);
  }

  componentDidUpdate(props, state) {
    if (props.location.hash !== this.props.location.hash)
      this.handleHash();
  }

  handleHash() {
    const { hash } = this.props.location;
    console.log(hash);
    if (hash) {
      const name = hash.slice(1);
      const slug = slugify(`lab-${name}`);
      this.setState({ timeframe: 'all', detail: slug }, () => setTimeout(() => {
        const el = document.getElementById(slug);
        if (el) {
          // This will attempt to center the element in the screen
          el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
      }, 0));
    }
  }

  renderJSX({ labs, dategrid }) {
    labs.other.sort((A, B) => {
      const lastA = last(A.events).datetime;
      const lastB = last(B.events).datetime;
      if (lastA < lastB) return 1;
      if (lastA > lastB) return -1;
      return A.description > B.description ? 1 : -1;
    });
    return (
      <LabChartTable
        X={getX(dategrid, this.state.timeframe)}
        labs={labs}
        timeframe={this.state.timeframe}
        setTimeframe={(timeframe) => this.setState({ timeframe })}
        detail={this.state.detail}
        setDetail={(detail) => {
          if (detail === this.state.detail)
            detail = null;
          this.setState({ detail });
        }}
      />
    );
  }

  render() {
    return (
      <div id='labs-overview' style={{ marginRight: '1vw' }}>
        <AfterLoad
          loader={() => fetchLabsTab(this.context)}
          reloadkey={this.context.id}
          postload={this.handleHash}
        >
          { this.renderJSX }
        </AfterLoad>
      </div>
    );
  }
}
