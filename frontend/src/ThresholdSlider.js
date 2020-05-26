import React from 'react';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';

export default class ThresholdSlider extends React.PureComponent {
  state = { value: this.props.initialValue };

  render() {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <label style={{ marginRight: '0.5em' }}>
          Relevance Threshold
        </label>
        <Slider
          min={0.2}
          max={1.0}
          step={0.01}
          tooltip={false}
          value={this.state.value}
          onChange={value => this.setState({ value })}
          onChangeComplete={() => this.props.onChangeComplete(this.state.value)}
        />
        <div style={{ marginLeft: '0.5em' }}>
          { this.state.value.toFixed(2) }
        </div>
      </div>
    );
  }
}
