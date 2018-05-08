import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, Rsm, AllState } from './rsm';
import Todo from './Todo';
import Counter from './Counter';

const store = createStore({}, true);

if (process.env.NODE_ENV === 'development') {
  // Console/debugging access to the store.
  window.store = store;
}

ReactDOM.render(
  <Rsm store={store}>
    <div className="container">
      <Todo />
      <Todo />
      <Counter />
      <Counter />
      <Counter name="Count X" lens={['counterX']} />
      <Counter name="Count Y" lens={['counterY']} />
      <AllState>
        {(state) => (
          <div>
            {JSON.stringify(state)}
          </div>
        )}
      </AllState>
    </div>
  </Rsm>,
  document.getElementById('root')
);
