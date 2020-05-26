import React from 'react';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import last from 'lodash/last';

import { slugify } from '../utils';
import VertInfoTable from '../VertInfoTable';
import InfoTable from '../InfoTable';
import HoverableText from '../HoverableText';
import FormattedCode from '../FormattedCode';

export default class PhecodeLabel extends React.PureComponent {
  render() {
    const { icds, description, code } = this.props.phecode;
    const events = icds
      .reduce((arr, item) => [...arr, ...item.events], [])
      .map(e => {
        if (e.toISOString)
          return e.toISOString().slice(0, 10);
        return e;
      })
      .sort();

    const widths = ['8ch', '8ch', 'auto'];
    const labels = ['ICD', 'Count', 'Description'];
    const data = icds.sort((A, B) =>
      B.events.length - A.events.length || (A.code > B.code ? -1 : 1)
    ).map(({ code, events, description }) =>
      ({ values: [code, events.length, description]})
    );

    return (
      <div onClick={this.props.onClick} style={{ paddingLeft: '0.5em' }}>
        <HoverableText
          textAlign='right'
          targetId={slugify(`phecode-${code}-label`)}
          target={
            <FormattedCode
              code={code}
              description={description}
            />
          }
          header={`${code} - ${description}`}
          body={
            <div>
              <VertInfoTable data={[
                {label: 'Description', value: description},
                {label: 'Total', value: events.length},
                {label: 'First', value: events[0]},
                {label: 'Latest', value: last(events)},
              ]} />
              <InfoTable widths={widths} labels={labels} data={data} />
            </div>
          }
        />
      </div>
    );
  }
}
