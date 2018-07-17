import React from 'react';
import { makeStateComponent } from '@samsch/rsm';

const actions = {
  increment: () => state => ({ count: state.count + 1 }),
  decrement: () => state => ({ count: state.count - 1 }),
};

const initialState = { count: 0 };

const State = makeStateComponent({ actions });

const Counter = props => (
  <State initialState={initialState} lens={props.lens || ['defaultCounter']}>
    {(state, actions) => (//console.log('Counter Render', state, props),
      <div className="row">
        <div className="col-auto">
          <strong>{props.name || 'Default'}</strong> Count: {state.count}
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.increment}
          >+1</button>{' '}
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.decrement}
          >-1</button>
        </div>
      </div>
    )}
  </State>
);

export default Counter;
