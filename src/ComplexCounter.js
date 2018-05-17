import React from 'react';
import { makeStateComponent } from './rsm';

const event = () => () => s => s;

const actions = {
  increment: () => state => ({ count: state.count + 1 }),
  incrementEveryOther: event(),
  decrement: () => state => ({ count: state.count - 1 }),
  slowIncrement: event(),
  toggleDoubleIncrement: event(),
};

// Add slowIncrement saga.
const slowIncrementSaga = function * ({ take, call, callAction }) {
  while (true) {
    yield take(actions.slowIncrement);
    yield call(Promise.delay(1000));
    yield callAction(actions.increment);
  }
};

// This can better be implemented by adding a bool flag in the regular state and
// having actions.increment add 2 to the count when the flag is true.
// However, this makes a decent example of some of the saga features.
const doubleIncrementSaga = function * ({ take, takeEvery, callAction }) {
  while (true) {
    yield take(actions.toggleDoubleIncrement);
    const doubleIncrement = yield takeEvery(actions.increment, function * () {
      // If we passed actions.increment to callAction, we would create an infinite loop
      // So instead, we are just passing a func which does the same thing.
      // It's named so that it's more obvious in logging. (It would be named stopDoubleIncrement
      // from the parent otherwise.)
      yield callAction(function otherIncrement () { return state => ({ count: state.count + 1 }); });
    });
    yield take(actions.toggleDoubleIncrement);
    doubleIncrement.stopChild();
  }
};

const saga = function * ({ take, callAction, run }) {
  yield run(slowIncrementSaga);
  yield run(doubleIncrementSaga);
  while (true) {
    yield take(actions.incrementEveryOther);
    yield take(actions.incrementEveryOther);
    yield callAction(actions.increment);
  }
};

const initialState = { count: 0 };

const State = makeStateComponent({ actions });

const ComplexCounter = props => (
  <State initialState={initialState} saga={saga} lens={props.lens || ['defaultComplexCounter']}>
    {(state, actions) => (//console.log('Counter Render', state, props),
      <div className="row">
        <div className="col-auto">
          <strong>{props.name || 'Complex Counter'}</strong> Count: {state.count}
        </div>
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.incrementEveryOther}
          >+1 every other</button>{' '}
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.decrement}
          >-1</button>{' '}
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.slowIncrement}
          >Delayed +1</button>{' '}
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={actions.toggleDoubleIncrement}
          >Toggle Double Increment</button>
        </div>
      </div>
    )}
  </State>
);

export default ComplexCounter;
