import MobileFormRenderer from './MobileFormRenderer';
import TabletFormRenderer from './TabletFormRenderer';
import DesktopFormRenderer from './DesktopFormRenderer';

const ResponsiveFormRenderer = (props) => {
  return (
    <>
      <div className="block sm:hidden">
        <MobileFormRenderer {...props} />
      </div>
      <div className="hidden sm:block lg:hidden">
        <TabletFormRenderer {...props} />
      </div>
      <div className="hidden lg:block">
        <DesktopFormRenderer {...props} />
      </div>
    </>
  );
};

export default ResponsiveFormRenderer;
