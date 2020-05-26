import React from 'react';
import HoverableText from '../HoverableText';

const DetailRows = ({ code, strengthGroups, X }) => {
  const rows = strengthGroups
    .map(({strength, labels, events, fill}, i) => {
      const rects = events.map((e, j) => (
        <rect key={j}
          y='5%'
          x={X(e)}
          fill={fill}
          width={1}
          height='90%'
        />
      ));
      return (
        <tr key={i}>
          <td className='med-detail-row-label'>
            <div style={{paddingLeft: '1em', textAlign: 'left'}}>
              <HoverableText
                textAlign='left'
                targetId={`med-${code}-tooltip-detail-${strength}`}
                target={strength}
                header={`Signatures at ${strength}`}
                body={labels.map((txt, i) =>
                  <div key={i}>{ txt }</div>
                )}
              />
            </div>
          </td>
          <td>
            <svg width='100%' viewBox='0 0 960 24'>
              <g transform="translate(10)">
                { rects }
              </g>
            </svg>
          </td>
        </tr>
      );
    });

  return (
    <tbody className='medrow'>
      { rows }
    </tbody>
  );
}

export default DetailRows;
