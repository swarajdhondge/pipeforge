import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';
import anonymousReducer from './slices/anonymous-slice';
import pipesReducer from './slices/pipes-slice';
import canvasReducer from './slices/canvas-slice';
import executionReducer from './slices/execution-slice';
import secretsReducer from './slices/secrets-slice';
import schemaReducer from './slices/schema-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    anonymous: anonymousReducer,
    pipes: pipesReducer,
    canvas: canvasReducer,
    execution: executionReducer,
    secrets: secretsReducer,
    schema: schemaReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
