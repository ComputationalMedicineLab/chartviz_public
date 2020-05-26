import React from 'react';

const MainChart = ({ X, strengthGroups }) => {
  const rectSets = strengthGroups
    .map(({ events, fill }, i) => {
      const rects = events.map((e, j) =>
        <rect key={j}
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
        { rectSets }
      </g>
    </svg>
  );
}

export default MainChart;
