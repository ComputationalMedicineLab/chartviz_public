/**
 * Rapidly search codes:
 *  Lab, ICD9, Med
 */
import React from 'react';
import groupBy from 'lodash/groupBy';
import { Icon } from 'react-icons-kit'
import { search } from 'react-icons-kit/fa/search';

import { slugify, titlecase } from './utils';
import { createCondition, fetchICD, searchHistory } from './api';
import { PatientCtx } from './contexts';

function genItemSignature(item) {
  let sig;
  if (item.kind === 'med') {
    sig = item.description;
  } else {
    sig = `${item.kind}${item.code}`;
  }
  return sig;
}

export default class CodeAutocomplete extends React.Component {
  static contextType = PatientCtx;

  constructor(props) {
    super(props);
    this.state = {
      overlayOpen: false,
      canBlur: false,
    };
    this.inputRef = React.createRef();
  }

  inputKeyDown = e => {
    if (e.key === 'Escape') {
      this.inputRef.current.blur();
    }
  }

  inputChange = e => {
    const value = e.target.value;
    let { controller } = this.state;
    if (controller !== undefined) {
      // cancel previous
      controller.abort();
    }
    controller = new window.AbortController();
    const signal = controller.signal;
    this.setState({ controller }, () => {
      const id = this.props.match.params.id;
      searchHistory(id, value, signal)
        .then(({ results }) => this.setState({ results }));
    });
  }

  inputFocus = e => {
    this.setState({ overlayOpen: true, canBlur: true });
  }

  inputBlur = e => {
    if (this.state.canBlur)
      this.setState({ overlayOpen: false, canBlur: false });
  }

  select = item => event => {
    this.setState({ activeItemSig: genItemSignature(item) }, async () => {
      const { id } = this.props.match.params;
      let url = `/${id}/${item.kind}s#${slugify(item.code)}`;
      if (item.kind == 'icd') {
        const { phecode } = await fetchICD(item.code_id);
        const resp = await createCondition(id, phecode.id);
        this.context.updateTabs(resp);
        url = `/${id}/phecodes/${phecode.id}`;
      }
      this.props.history.push(url);
      this.setState({ overlayOpen: false });
    });
  }

  renderResults() {
    const { activeItemSig, overlayOpen } = this.state;
    const byKind = groupBy(this.state.results || [], item => item.kind);
    const resultsets = Object.entries(byKind)
      .map(([kind, items], i) =>
        <tbody key={i}>
          <tr>
            <td colSpan={3} className='autocomplete-header'>
              { titlecase(kind) }
            </td>
          </tr>
          {
            items.map((item, i) =>
              <tr key={i}
                className='autocomplete-item'
                onMouseDown={() => this.setState({ canBlur: false })}
                onMouseUp={() => this.setState({ canBlur: true })}
                onClick={this.select(item)}
                style={{ backgroundColor: activeItemSig === genItemSignature(item) ? '#33b5e5' : 'white' }}
              >
                <th>{ item.code }</th>
                <td>{ item.count }</td>
                <td>{ titlecase(item.description) }</td>
              </tr>
            )
          }
        </tbody>
      );
    const focusStyles = {};
    if (overlayOpen) {
      focusStyles.zIndex = 99;
      focusStyles.opacity = 1.0;
      focusStyles.maxHeight = '80vh';
    }
    return (
      <div id='autocomplete-results' style={focusStyles}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '10ch' }}></th>
              <th style={{ width: '4ch' }}></th>
              <th style={{ width: 'auto' }}></th>
            </tr>
          </thead>
          { resultsets }
        </table>
      </div>
    );
  }

  render() {
    return (
      <div id='autocomplete-container'>
        <input
          ref={this.inputRef}
          style={{ width: '100%' }}
          onKeyDown={this.inputKeyDown}
          onChange={this.inputChange}
          onFocus={this.inputFocus}
          onBlur={this.inputBlur}
        />
        { this.renderResults() }
      </div>
    );
  }
}
