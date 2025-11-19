import type { FC } from 'react';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { clearMigrationCount } from '../../store/slices/auth-slice';

export const MigrationSuccessToast: FC = () => {
  const dispatch = useDispatch();
  const { migratedPipesCount } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (migratedPipesCount && migratedPipesCount > 0) {
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dispatch(clearMigrationCount());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [migratedPipesCount, dispatch]);

  if (!migratedPipesCount || migratedPipesCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Pipes Migrated Successfully!
            </h3>
            <p className="mt-1 text-sm text-green-700">
              {migratedPipesCount} {migratedPipesCount === 1 ? 'pipe has' : 'pipes have'} been
              saved to your account.
            </p>
          </div>
          <button
            onClick={() => dispatch(clearMigrationCount())}
            className="flex-shrink-0 text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
