import { useLoadingPolicy } from '../hooks/useLoadingPolicy';

export default function Loader() {
  const { visible, shouldShowProgress } = useLoadingPolicy(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        {shouldShowProgress && (
          <div className="w-full">
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse" />
            </div>
            <p className="mt-2 text-center text-xs text-white/80">Still working...</p>
          </div>
        )}
      </div>
    </div>
  )
}