// Control Props
// http://localhost:3000/isolated/exercise/06.js

import { noop } from 'lodash'
import * as React from 'react'
import { useEffect } from 'react'
import warning from 'warning'
import {Switch} from '../switch'

const callAll = (...fns) => (...args) => fns.forEach(fn => fn?.(...args))

const actionTypes = {
  toggle: 'toggle',
  reset: 'reset',
}

function toggleReducer(state, {type, initialState}) {
  switch (type) {
    case actionTypes.toggle: {
      return {on: !state.on}
    }
    case actionTypes.reset: {
      return initialState
    }
    default: {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
}

function useControlledSwitchWarning(
  controlPropValue,
  // controlPropName,
  // componentName
) {
  const __DEV__ = process.env.NODE_ENV === 'development'
  const isControlled = controlPropValue != null;
  const {current: wasControlled } = React.useRef(isControlled)
  let effect = noop;

  if (__DEV__) {
    effect = function() {
      warning(
        !(isControlled && wasControlled),
        'changing from uncontrolled to controlled'
      )
      warning(
        !(!isControlled && wasControlled),
        'changing from controlled to uncontrolled'
      )
    }
  }

  React.useEffect(effect, [effect, isControlled, wasControlled])
}
// Based off of the below hook in ReachUI
// https://github.com/reach/reach-ui/blob/a376daec462ccb53d33f4471306dff35383a03a5/packages/utils/src/index.tsx#L407-L443
function useOnChangeReadOnlyWarning(
  controlPropValue,
  // controlPropName,
  // componentName,
  hasOnChange,
  readOnly,
  // readOnlyProp,
  // initialValueProp,
  // onChangeProp
) {
  const __DEV__ = process.env.NODE_ENV === 'development'
  const isControlled = controlPropValue != null;
  let effect = noop;

  if (__DEV__) {
    effect = function() {
      // Add readOnly flag so that you only get the error if readOnly
      // is specified and set to false
      // if (!hasOnChange && onIsControlled && !readOnly) {
      //   console.error('Something bad!');
      // }
      // or use the warning package that react uses
      warning(
        !(!hasOnChange && isControlled && !readOnly), 
        'Something real bad'
      )
    }
  }
  
  React.useEffect(effect, [effect, hasOnChange, isControlled, readOnly])
}

function useToggle({
  initialOn = false,
  reducer = toggleReducer,
  onChange,
  on: controlledOn,
  readOnly = false
} = {}) {
  const {current: initialState} = React.useRef({on: initialOn})
  const [state, dispatch] = React.useReducer(reducer, initialState)

  // Determine if we're managing controlled state
  const onIsControlled = controlledOn != null
  const on = onIsControlled ? controlledOn : state.on
  
  // Show warning if swapping from controlled to uncontrolled
  // useControlledSwitchWarning(controlledOn, 'on', 'useToggle')
  useControlledSwitchWarning(controlledOn)
  
  // const hasOnChange = Boolean(onChange)
  // useOnChangeReadOnlyWarning(
  //   controlledOn, 
  //   'on', 
  //   'useToggle',
  //   Boolean(onChange),
  //   readOnly,
  //   'readOnly',
  //   'initialOn',
  //   'onChange'
  // )
  useOnChangeReadOnlyWarning(controlledOn, Boolean(onChange), readOnly)

  // We want to call `onChange` anytime we need to do a state change, 
  // but only want to call `dispatch` if `!onIsControlled` (otherwise 
  // we could get unnecessary renders).
  function dispatchWithOnChange(action) {
    if (!onIsControlled) {
      dispatch(action)
    }

    onChange?.(reducer({...state, on}, action), action)
  }
  // onChange = suggested changes.
  // "Suggested changes": the changes we would make if we were
  // managing the state ourselves. This is similar to how a controlled <input />
  // `onChang e` callback works. When your handler is called, you get an event
  // which has information about the value input that _would_ be set to if that
  // state were managed internally.
  // So how do we determine our suggested changes? What code do we have to
  // calculate the changes based on the `action` we have here? That's right!
  // The reducer! So if we pass it the current state and the action, then it
  // should return these "suggested changes!"

  const toggle = () => dispatchWithOnChange({type: actionTypes.toggle})
  const reset = () => dispatchWithOnChange({type: actionTypes.reset, initialState})

  function getTogglerProps({onClick, ...props} = {}) {
    return {
      'aria-pressed': on,
      onClick: callAll(onClick, toggle),
      ...props,
    }
  }

  function getResetterProps({onClick, ...props} = {}) {
    return {
      onClick: callAll(onClick, reset),
      ...props,
    }
  }

  return {
    on,
    reset,
    toggle,
    getTogglerProps,
    getResetterProps,
  }
}

function Toggle({on: controlledOn, onChange, readOnly}) {
  const {on, getTogglerProps} = useToggle({on: controlledOn, onChange, readOnly})
  const props = getTogglerProps({on})

  return <Switch {...props} />
}

function App() {
  const [bothOn, setBothOn] = React.useState(false)
  const [timesClicked, setTimesClicked] = React.useState(0)

  function handleToggleChange(state, action) {
    if (action.type === actionTypes.toggle && timesClicked > 4) {
      return
    }
    setBothOn(state.on)
    setTimesClicked(c => c + 1)
  }

  function handleResetClick() {
    setBothOn(false)
    setTimesClicked(0)
  }

  return (
    <div>
      <div>
        {/* 
          If user doesn't pass the onChange, it will error.
          If user passes the readOnly prop as true, it won't error.
          <Toggle on={bothOn} /> 
        */}
        <Toggle on={bothOn} onChange={handleToggleChange} />
        <Toggle on={bothOn} onChange={handleToggleChange} />
      </div>
      {timesClicked > 4 ? (
        <div data-testid="notice">
          Whoa, you clicked too much!
          <br />
        </div>
      ) : (
        <div data-testid="click-count">Click count: {timesClicked}</div>
      )}
      <button onClick={handleResetClick}>Reset</button>
      <hr />
      <div>
        <div>Uncontrolled Toggle:</div>
        <Toggle
          onChange={(...args) =>
            console.info('Uncontrolled Toggle onChange', ...args)
          }
        />
      </div>
    </div>
  )
}

export default App
// we're adding the Toggle export for tests
export {Toggle}

/*
eslint
  no-unused-vars: "off",
*/
