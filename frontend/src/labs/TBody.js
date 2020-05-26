/**
 * Used as a sentinel so that we can take advantage of some of
 * styled-component's more advanced child styling features (see `Expander` in
 * meds/CombinedLabel.js).  There is an identical but separately defined
 * sentinel for labs/meds - separately defined so that they won't conflict if both
 * types of chart are on the same page (e.g. with conditions).
 */
import React from 'react';
import styled from 'styled-components';

const TBody = styled.tbody``;
export default TBody;
