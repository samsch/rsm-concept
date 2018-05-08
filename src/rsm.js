import React from 'react';
import Kefir from 'kefir';
import Atom from 'kefir.atom';
import * as R from 'ramda';

export const initializationAction = {};
const RsmContext = React.createContext();

export const createStore = (initialState, debugging = false) => {
  const actionStream = Kefir.pool();
  const state = new Atom(initialState);
  // Synchronous calls to dispatch will only cause one update event on the next tick.

  let actionQueue = [];
  let modifyQueued = false;
  const modify = () => {
    modifyQueued = false;
    const currentActions = actionQueue.slice();
    actionQueue = [];
    state.modify(R.pipe(...currentActions.map(a => a.action)));
    currentActions.forEach((action) => {
      actionStream.plug(Kefir.constant(action));
    });
  };
  const dispatch = (action, ref, args) => {

    if (debugging) {
      console.log('Action', ref);
    }
    actionQueue.push({ action, ref, args });
    if (!modifyQueued) {
      modifyQueued = true;
      setTimeout(modify);
    }
  };
  if (debugging) {
    state.onValue(v => {
      console.log('Next State', v);
    });
  }
  const updates = state.changes();
  return {
    dispatch,
    actionStream,
    property: state,
    // TODO test unsubscribe
    subscribe: f => updates.observe({ value: f }).unsubscribe,
  };
};

export class Rsm extends React.Component {
  constructor (props) {
    super(props);
    if (this.props.store) {
      this.store = this.props.store;
    } else {
      this.store = createStore(this.props.initialState);
    }
  }
  render () {
    if (process.env.NODE_ENV === 'development' && this.props.store !== this.store) {
      console.warn('Rsm property "atom" can not be updated.');
    }
    return <RsmContext.Provider value={this.store}>{this.props.children}</RsmContext.Provider>;
  }
}

let stateRenders = 0;

class State extends React.Component {
  constructor (props) {
    super(props);
    this.updateState = this.updateState.bind(this);
    this.getLens = this.getLens.bind(this);
    this.getActions = this.getActions.bind(this);
    const setState = currentState => {
      const current = R.view(this.getLens(), currentState);
      if (current === undefined) {
        this.props.store.dispatch(
          R.set(this.getLens(), this.props.initialState),
          initializationAction,
          [this.props.initialState, this.props.lens]
        );
        this.state = {
          state: this.props.initialState,
          // actions: this.makeActions(),
        };
      } else {
        this.state = {
          state: current,
          // actions: this.makeActions(),
        };
      }
    };
    this.props.store.property.observe({
      value: setState,
    }).unsubscribe();
  }
  getLens () {
    if (this.lastPath !== this.props.lens || !this.lens) {
      this.lens = R.lensPath(this.props.lens || []);
      this.lastPath = this.props.lens;
    }
    return this.lens;
  }
  getActions () {
    // Actions should be cached based on the lens and actions props as the key.
    return Object.entries(this.props.actions || {}).reduce((actions, [name, func]) => {
      actions[name] = (...args) => {
        const action = func(...args);
        // The Object.assign here puts any extra properties of the function and adds them to the root dispatched.
        // action. This allows for potentially using such properties for saga-like stuff.
        return this.props.store.dispatch(R.over(this.getLens(), action), func, args);
      };
      return actions;
    }, {});
  }
  updateState (state) {
    this.prevState = this.nextState;
    this.nextState = R.view(this.getLens(), state);
    if (this.prevState !== this.nextState) {
      this.setState({ state: this.nextState });
    }
  }
  componentDidMount () {
    this.unsubscribe = this.props.store.subscribe(this.updateState);
    if (this.props.saga) {
      this.killSaga = this.props.saga({ actionStream: this.props.store.actionStream, getActions: this.getActions });
    }
  }
  componentWillUnmount () {
    this.unsubscribe();
    this.killSaga();
  }
  render () {
    console.log('Render Count', stateRenders++);
    // console.log('State render', this.state.state);
    return this.props.children(this.state.state, this.getActions());
  }
}

/* eslint-disable react/display-name */
export const makeStateComponent = ({ initialState, actions, lens }) => props => (
  <RsmContext.Consumer>
    {store => (
      <State store={store} initialState={initialState} actions={actions} lens={lens} {...props} />
    )}
  </RsmContext.Consumer>
);
/* eslint-enable react/display-name */

export const AllState = makeStateComponent({ initialState: undefined });
