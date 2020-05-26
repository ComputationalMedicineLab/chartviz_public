import React from 'react';
import capitalize from 'lodash/capitalize';
import last from 'lodash/last';
import isNil from 'lodash/isNil';
import { Icon } from 'react-icons-kit';
import { compress } from 'react-icons-kit/fa/compress';
import { expand } from 'react-icons-kit/fa/expand';
import styled from 'styled-components';

import FormattedCode from '../FormattedCode';
import HoverableText from '../HoverableText';
import { titlecase } from '../utils';

import TBody from './TBody';

const Expander = styled(Icon)`
  margin-right: 0.5em;
  opacity: ${p => p.noshow ? 0 : 0.5};
  ${TBody}:hover & {
    opacity: ${p => p.noshow ? 0 : 1.0};
  }
  transition: all 250ms;
`;

const MainLabel = ({ detail, meds, multirow, name }) => {
  meds.sort((a, b) => b.strength_num - a.strength_num);
  let code = titlecase(name);
  const { strength, route, frequency, relevance } = meds[0];
  if (!isNil(relevance)) {
    code = `${relevance.toFixed(4)} ${code}`;
  }
  const partialDesc = `${strength} ${route} ${frequency}`.toLowerCase();
  return (
    <HoverableText
      textAlign='left'
      targetId={`med-${code}-tooltip`}
      target={
        <span>
          <Expander
            icon={detail ? compress : expand}
            noshow={multirow ? 0 : 1}
          />
          <FormattedCode code={code} description={partialDesc} />
        </span>
      }
      header={`${code} - ${partialDesc}`}
      body={
        <table className='info'>
          <thead>
            <tr>
              <th>Medication</th>
              <th>Most Recent Mention</th>
            </tr>
          </thead>
          <tbody>
            {
              meds.map(({ description, events }) => (
                <tr key={description}>
                  <td>{ capitalize(description) }</td>
                  <td>{ last(events).format('YYYY-MM-DD') }</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      }
    />
  );
}

export default MainLabel;
