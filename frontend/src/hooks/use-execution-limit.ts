import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { incrementExecutionCount, setShowSignupModal } from '../store/slices/anonymous-slice';

export const useExecutionLimit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { executionCount, executionLimit, showSignupModal } = useSelector(
    (state: RootState) => state.anonymous
  );

  const canExecute = isAuthenticated || executionCount < executionLimit;
  const remaining = executionLimit - executionCount;

  const checkAndIncrement = (): boolean => {
    if (isAuthenticated) {
      return true; // No limit for authenticated users
    }

    if (executionCount >= executionLimit) {
      // Show signup modal
      dispatch(setShowSignupModal(true));
      return false;
    }

    // Increment count
    dispatch(incrementExecutionCount());
    return true;
  };

  const closeSignupModal = () => {
    dispatch(setShowSignupModal(false));
  };

  return {
    canExecute,
    remaining,
    executionCount,
    executionLimit,
    showSignupModal,
    checkAndIncrement,
    closeSignupModal,
  };
};
