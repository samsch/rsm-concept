import React from 'react';
import { makeStateComponent } from './rsm';

const event = () => () => s => s;

const actions = {
  increment: () => state => ({ count: state.count + 1 }),
  incrementEveryOther: event(),
  decrement: () => state => ({ count: state.count - 1 }),
  slowIncrement: event(),
};

// Add slowIncrement saga.

const saga = function * ({ take, callAction }) {
  while (true) {
    yield take(actions.incrementEveryOther);
    yield take(actions.incrementEveryOther);
    yield callAction(actions.increment);
  }
};

const initialState = { count: 0 };

const State = makeStateComponent({ actions });

const Counter = props => (
  <State initialState={initialState} saga={saga} lens={props.lens || ['defaultCounter']}>
    {(state, actions) => (//console.log('Counter Render', state, props),
      <div className="row">
        <div className="col-auto">
          <strong>{props.name || 'Default'}</strong> Count: {state.count}
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.incrementEveryOther}
          >+1 every other</button>
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
