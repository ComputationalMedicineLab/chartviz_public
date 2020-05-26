/**
 * A Label for rows in lab tables
 */
import React from 'react';
import capitalize from 'lodash/capitalize';
import last from 'lodash/last';
import isNil from 'lodash/isNil';

import FormattedCode from '../FormattedCode';
import HoverableText from '../HoverableText';
import VertInfoTable from '../VertInfoTable';


export default class Label extends React.Component {
  shouldComponentUpdate(props) {
    return props.lab.id !== this.props.lab.id;
  }

  render() {
    const textAlign = this.props.textAlign || 'right';
    const description = capitalize(this.props.lab.description);
    let body = description;
    if (this.props.lab.events.length) {
      const { datetime, value, unit } = last(this.props.lab.events);
      body = (
        <VertInfoTable data={[
          { label: 'Description', value: description },
          { label: 'Total', value: num },
          {
            label: datetime.format('YYYY-MM-DD HH:mm'),
            value: `${value} ${unit !== '.' && unit ? unit : ''}`,
          }
        ]} />
      );
    }
    const { num, relevance } = this.props.lab;
    let code = this.props.lab.code;
    if (!isNil(relevance)) {
      code = `${relevance.toFixed(4)} ${code}`;
    }
    return (
      <HoverableText
        textAlign={textAlign}
        targetId={`lab-${code}-tooltip`}
        target={<FormattedCode code={code} description={description} />}
        header={`${code} - ${description}`}
        body={body}
      />
    );
  }
}
