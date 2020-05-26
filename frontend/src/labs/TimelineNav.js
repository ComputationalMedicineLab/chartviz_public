/**
 * Allows navigation of three timeframes: all time, year, month
 */
import React from 'react';
import { Icon } from 'react-icons-kit';
import { chevronLeft } from 'react-icons-kit/fa/chevronLeft';
import { chevronRight } from 'react-icons-kit/fa/chevronRight';

const TimelineNav = ({ timeframe, onTimeframeSelect }) => {
  if (timeframe === undefined || onTimeframeSelect === undefined)
    return null;

  let goBack = '', goForward = '', text = '';

  if (timeframe === 'month') {
    text = 'Past Month';
    goBack = (
      <button
        style={{ border: 'none' }}
        onClick={() => onTimeframeSelect('year')}
        title='Past Year'
      >
        <Icon icon={chevronLeft} />
      </button>
    );
  } else if (timeframe === 'year') {
    text = 'Past Year';
    goBack = (
      <button
        style={{ border: 'none' }}
        onClick={() => onTimeframeSelect('all')}
        title='All Time'
      >
        <Icon icon={chevronLeft} />
      </button>
    );
    goForward = (
      <button
        style={{ border: 'none' }}
        onClick={() => onTimeframeSelect('month')}
        title='Past Month'
      >
        <Icon icon={chevronRight} />
      </button>
    );
  } else if (timeframe === 'all') {
    text = 'All Time';
    goForward = (
      <button
        style={{ border: 'none' }}
        onClick={() => onTimeframeSelect('year')}
        title='Past Year'
      >
        <Icon icon={chevronRight} />
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      margin: '0.25rem',
    }}>
      <div>{ goBack }</div>
      <div>{ text }</div>
      <div>{ goForward }</div>
    </div>
  );
}

export default TimelineNav;
