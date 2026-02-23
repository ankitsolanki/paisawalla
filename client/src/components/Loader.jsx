import LoadingSpinner from './ui/LoadingSpinner';

const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/90 z-[9999]">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-muted-foreground text-sm">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <LoadingSpinner size="md" />
      {message && (
        <p className="mt-4 text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
};

export default Loader;
