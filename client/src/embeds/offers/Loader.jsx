import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-10 min-h-[200px]">
      <LoadingSpinner />
      <p className="mt-6 text-base text-muted-foreground font-medium">
        Fetching your offers...
      </p>
      <p className="mt-2 text-sm text-muted-foreground/80">
        This may take a few moments
      </p>
    </div>
  );
};

export default Loader;
