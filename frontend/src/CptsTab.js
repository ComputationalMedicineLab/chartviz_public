import React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { RingLoader } from 'react-spinners';
import { CSSTransition } from 'react-transition-group';

import capitalize from 'lodash/capitalize';
import groupBy from 'lodash/groupBy';
import head from 'lodash/head';
import last from 'lodash/last';

import { interpolateLab } from 'd3-interpolate';
import { scaleOrdinal, scaleTime } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import { timeFormat } from 'd3-time-format';
import { timeYear, timeMonth, timeDay } from 'd3-time';

import { Icon } from 'react-icons-kit';
import { compress } from 'react-icons-kit/fa/compress';
import { expand } from 'react-icons-kit/fa/expand';

import FormattedCode from './FormattedCode';
import HoverableText from './HoverableText';
import Timeline from './Timeline';
import { fetchProceduresTab } from './api';
import { PatientCtx } from './contexts';

const TBody = styled.tbody``;

const Expander = styled(Icon)`
  margin-right: 0.5em;
  opacity: 0.5;
  ${TBody}:hover & {
    opacity: 1.0;
  }
  transition: all 250ms;
`;

export default class CptsTab extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      medicineOpen: false,
      radiologyOpen: false,
      surgeryOpen: false,
      highlight: null,
    };
    this.colorScale = scaleOrdinal(schemePaired);
    this.load = this.load.bind(this);

    this.handleHash = this.handleHash.bind(this);
    this.renderMainChart = this.renderMainChart.bind(this);
    this.renderDetailRows = this.renderDetailRows.bind(this);
  }

  load() {
    this.setState({ loading: true }, async () => {
      const resp = await fetchProceduresTab(this.context);
      const X = scaleTime()
        .domain([
          timeYear(head(resp.dategrid)),
          timeDay(last(resp.dategrid))
        ])
        .nice()
        .range([0, 940]);
      this.setState({ loading: false, ...resp, X }, this.handleHash);
    });
  }

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(props, state) {
    if (props.location.hash !== this.props.location.hash) {
      this.handleHash();
    }
  }

  handleHash() {
    const hash = this.props.location.hash.slice(1);
    if (hash) {
      const codept = this.state.cpts.find(({ cpt }) => cpt == hash);
      if (codept) {
        const newState = {
          [`${codept.category}Open`]: true,
          highlight: codept.cpt,
        };
        this.setState(newState, () => {
          setTimeout(() => {
            const el = document.getElementById(`cpt-${hash}`);
            if (el) {
              let { top } = el.getBoundingClientRect();
              // top is relative to the viewport, so we have to add the scroll offset
              top += window.scrollY;
              // Subtract roughly the height of the sticky headers
              top -= 100;
              window.scroll({ top });
            }
          }, 0);
        });
      }
    }
  }

  renderMainChart(cpts) {
    const { X } = this.state;
    const bySub = groupBy(cpts, 'subcategory');
    const subs = Object.keys(bySub).sort();
    const ticks = subs.map((sub, i, arr) => {
      const codes = bySub[sub];
      const events = codes.reduce((acc, code) => {
        return [...acc, ...code.events];
      }, []);
      const fill = this.colorScale(i % 12);
      const rects = events.map((e, j)=>
        <rect
          key={`${i}-${j}`}
          x={X(e)}
          y='5%'
          fill={fill}
          width={1}
          height='90%'
        />
      );
      return <g key={i}>{ rects }</g>;
    });
    return (
      <svg width='100%' viewBox='0 0 960 24'>
        <g transform='translate(10)'>
          { ticks }
        </g>
      </svg>
    );
  }

  renderDetailRows(cpts) {
    const { X } = this.state;
    const bySub = groupBy(cpts, 'subcategory');
    const subs = Object.keys(bySub).sort();
    const rows = [];
    subs.forEach((sub, i, arr) => {
      const codes = bySub[sub].sort((A, B) => {
        return B.events.length - A.events.length;
      });
      const fill = this.colorScale(i % 12);
      codes.forEach((cpt, j) => {
        const rects = cpt.events.map((e, k) =>
          <rect
            key={`${i}-${j}-${k}`}
            x={X(e)}
            y='5%'
            fill={fill}
            width={1}
            height='90%'
          />
        );
        const rowStyle = {};
        if (this.state.highlight === cpt.cpt) {
          rowStyle.backgroundColor = 'lightgoldenrodyellow';
        }
        rows.push(
          <tr
            id={`cpt-${cpt.cpt}`}
            key={`${i}-${j}`}
            style={{ borderBottom: '1px dashed gainsboro', ...rowStyle }}
          >
            <td style={{ background: `linear-gradient(90deg, ${fill}, 10%, white)` }}>
              <HoverableText
                textAlign='left'
                targetId={`cpt-${cpt.cpt}-tooltip`}
                target={<FormattedCode code={cpt.cpt} description={cpt.description} />}
                header={`${capitalize(sub)} - ${cpt.cpt}`}
                body={cpt.description}
              />
            </td>
            <td>
              <svg width='100%' viewBox='0 0 960 24'>
                <g transform='translate(10)'>
                  { rects }
                </g>
              </svg>
            </td>
          </tr>
        );
      });
    });
    return (
      <tbody className='medrow'>
        { rows }
      </tbody>
    );
  }

  render() {
    if (this.state.loading) {
      return (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <RingLoader color='#36D7B7' />
        </div>
      );
    }

    const { dategrid, cpts, X } = this.state;
    const byCat = groupBy(cpts, 'category');

    return (
      <article id='cpts'>
        <table className='charts'>
          <thead>
            <tr>
              <th style={{ width: `26ch` }}></th>
              <th style={{ width: 'auto' }}></th>
            </tr>
            <tr style={{ borderBottom: '1px solid gray' }}>
              <th />
              <th className='timeline'>
                <Timeline X={X} />
              </th>
            </tr>
          </thead>

          {/* Medicine */}
          <TBody>
            <tr
              style={{ borderBottom: '1px solid gray' }}
              onClick={() => this.setState({ medicineOpen: !this.state.medicineOpen })}
            >
              <td>
                <Expander icon={this.state.medicineOpen ? compress : expand} />
                Medicine
              </td>
              <td>
                { this.renderMainChart(byCat['medicine']) }
              </td>
            </tr>
          </TBody>
          <CSSTransition
            in={this.state.medicineOpen}
            timeout={500}
            classNames='medrow'
          >
            { this.renderDetailRows(byCat['medicine']) }
          </CSSTransition>

          {/* Radiology */}
          <TBody>
            <tr
              style={{ borderBottom: '1px solid gray' }}
              onClick={() => this.setState({ radiologyOpen: !this.state.radiologyOpen })}
            >
              <td>
                <Expander icon={this.state.radiologyOpen ? compress : expand} />
                Radiology
              </td>
              <td>
                { this.renderMainChart(byCat['radiology']) }
              </td>
            </tr>
          </TBody>
          <CSSTransition
            in={this.state.radiologyOpen}
            timeout={500}
            classNames='medrow'
          >
            { this.renderDetailRows(byCat['radiology']) }
          </CSSTransition>

          {/* Surgery */}
          <TBody>
            <tr
              style={{ borderBottom: '1px solid gray' }}
              onClick={() => this.setState({ surgeryOpen: !this.state.surgeryOpen })}
            >
              <td>
                <Expander icon={this.state.surgeryOpen ? compress : expand} />
                Surgery
              </td>
              <td>
                { this.renderMainChart(byCat['surgery']) }
              </td>
            </tr>
          </TBody>
          <CSSTransition
            in={this.state.surgeryOpen}
            timeout={500}
            classNames='medrow'
          >
            { this.renderDetailRows(byCat['surgery']) }
          </CSSTransition>
        </table>
      </article>
    );
  }
}
