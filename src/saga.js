import Promise from 'bluebird';

const take = ref => ({ type: 'take', ref });
const takeEveryEffect = (ref, saga) => ({ type: 'takeEvery', ref, saga });
const call = promise => ({ type: 'promise', promise });
const callActionEffect = (action, args) => ({ type: 'callAction', action, args });

const effects = {
  take,
  takeEvery: takeEveryEffect,
  call,
  callAction: callActionEffect,
};

async function takeOne (observable, ref) {
  return new Promise((res, rej) => {
    const subscription = observable.observe({
      value: value => {
        if (ref === undefined || value.ref === ref) {
          res(value);
          subscription.unsubscribe();
        }
      },
      error: error => {
        rej(error);
        subscription.unsubscribe();
      }
    });
  });
}

function takeEvery (ref, saga, localActionStream, globalStateProperty, callAction) {
  const subscription = localActionStream.observe({
    value: value => {
      if (ref === undefined || value.ref === ref) {
        /* eslint-disable no-use-before-define */
        Saga(saga, localActionStream, globalStateProperty, callAction, value);
        /* eslint-enable no-use-before-define */
      }
    },
  });
  return subscription.unsubscribe;
}

export default function Saga (saga, localActionStream, globalStateProperty, callAction, initial) {
  localActionStream.spy('localActionStream.buffer.changes');
  const running = saga(effects);
  // TODO children processes is not at all tested yet.
  const children = [];
  let stopped = false;
  const runSaga = (...args) => {
    if (stopped) {
      return;
    }
    const message = running.next(...args);
    if (message.done === true) {
      return;
    }
    switch (message.value.type) {
      // TODO Call effect is not yet tested.
      case 'call':
        message.value.promise.then(value => {
          runSaga(value);
        })
        .catch(error => {
          running.throw(error);
        })
        .catch(error => {
          console.log('Saga did not handle <call> error', saga, error);
        });
        break;
      case 'take':
        takeOne(localActionStream, message.value.ref)
          .then(action => { runSaga(action); })
          .catch(error => {
            console.log('Caught error taking an action in saga', saga);
            running.throw(error);
          })
          .catch(error => {
            console.log('Saga did not handle <take> error', saga, error);
          });
        break;
      // TODO TakeEvery effect is not yet tested.
      case 'takeEvery':
        (() => {
          const stopChild = takeEvery(
            message.value.ref,
            message.value.saga,
            localActionStream,
            globalStateProperty,
            callAction
          );
          children.concat(stopChild);
          runSaga({ stopChild: () => {
            const index = children.indexOf(stopChild);
            children.splice(index, 1);
            stopChild();
          }});
        })();
        break;
      case 'callAction':
        // Order matters here, takeOne must be called first, or it misses the event from callAction.
        takeOne(localActionStream)
          .then(action => { runSaga(action); })
          .catch(error => {
            console.log('Caught error waiting for action to complete in saga', saga);
            running.throw(error);
          })
          .catch(error => {
            console.log('Saga did not handle <callAction> error', saga, error);
          });
        callAction(message.value.action, message.value.args);
        break;
    }
  };
  runSaga(initial);
  return (stopError) => {
    const stopping = stopError || new Error('Saga stopped');
    stopping.stopError = true;
    children.forEach(stopChild => {
      stopChild(stopping);
    });
    running.throw(stopping);
    stopped = true;
  };
}