import React from 'react';
import * as R from 'ramda';
import { makeStateComponent } from './rsm';

let id = 0;
const actions = {
  updateNewTodoValue: value => state => ({...state, newTodoValue: value}),
  addTodo: () => state => ({
    ...state,
    list: state.list.concat({ desc: state.newTodoValue, completed: false, id: `t-${id++}` }),
    // newTodoValue could be cleared here, but instead we are calling updateNewTodoValue from
    // the submit handler below to show how multiple actions called will only result in one update.
  }),
  // A more functional update style can be used with something like Ramda, as shown in these next two
  // actions. These two in particular could probably be simplified more using partial.lenses as well.
  completeTodo: id => state =>
    R.set(
      R.lensPath(['list', state.list.findIndex(todoItem => todoItem.id === id), 'completed']),
      true,
      state
    ),
  uncompleteTodoClone: id => state =>
    R.set(
      R.lensPath(['list', state.list.findIndex(todoItem => todoItem.id === id), 'completed']),
      false,
      state
    ),
  uncompleteTodo: id => state => {
    const index = state.list.findIndex(todoItem => todoItem.id === id);
    return {
      ...state,
      list: [
        ...state.list.slice(0, index),
        { ...state.list[index], completed: false },
        ...state.list.slice(index + 1),
      ],
    };
  },
};

const initialState = { list: [], newTodoValue: '' };

const State = makeStateComponent({ initialState, actions, lens: ['todo'] });

const Todo = () => (
  <State>
    {(state, actions) => (
      <div>
        <ul className="list-group">
          {state.list.map(todoItem => (
            <li className="list-group-item" key={todoItem.id}>
              {todoItem.desc}{' '}
              {todoItem.completed ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => actions.uncompleteTodo(todoItem.id)}
                >
                  ✕
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => actions.completeTodo(todoItem.id)}
                >
                  ✓
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={e => {
          e.preventDefault();
          actions.addTodo();
          actions.updateNewTodoValue('');
          // The result of these actions would normally be combined in addTodo(), however, calling
          // multiple actions sychronously only results in a single update (and render) which is
          // shown here. (Just add a console.log() call in this render function to see it only is
          // called once on submit, and you will also only see one "Next State" log with rsm
          // debugging turned on.)
        }}>
          <div className="form-group">
            <label htmlFor="add-todo-text">Todo item</label>
            <input
              type="text"
              id="add-todo-text"
              className="form-control"
              value={state.newTodoValue}
              onChange={event => actions.updateNewTodoValue(event.target.value)}
            />
            <button type="submit" className="btn btn-outline-primary">Add Todo</button>
          </div>
        </form>
      </div>
    )}
  </State>
);

export default Todo;
