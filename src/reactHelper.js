import { useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { errorsActions } from './store';

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useEffectAsync = (effect, deps) => {
  const dispatch = useDispatch();
  const cleanupRef = useRef(null);

  useEffect(() => {
    effect()
      .then((result) => {
        cleanupRef.current = typeof result === 'function' ? result : null;
      })
      .catch((error) => dispatch(errorsActions.push(error.message)));

    return () => {
      if (typeof cleanupRef.current === 'function') {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [...deps, dispatch]);
};

export const useCatch = (method) => {
  const dispatch = useDispatch();
  return (...parameters) => {
    method(...parameters).catch((error) => dispatch(errorsActions.push(error.message)));
  };
};

export const useCatchCallback = (method, deps) => {
  return useCallback(useCatch(method), deps);
};