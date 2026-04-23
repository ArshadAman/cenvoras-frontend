import React, { forwardRef } from 'react';
import ClassicTemplate from './templates/ClassicTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import GenzTemplate from './templates/GenzTemplate';
import ServiceTemplate from './templates/ServiceTemplate';
import LegendTemplate from './templates/LegendTemplate';
import BillShipTemplate from './templates/BillShipTemplate';

// Unified Invoice Preview Router Component
// Determines which structural layout to render based on user preferences

const InvoicePreview = forwardRef((props, ref) => {
  const layoutType = props.template?.layout?.layoutType || 'classic';

  // Route to specific template component
  switch (layoutType) {
    case 'professional':
      return <ProfessionalTemplate ref={ref} {...props} />;
    case 'genz':
      return <GenzTemplate ref={ref} {...props} />;
    case 'service':
      return <ServiceTemplate ref={ref} {...props} />;
    case 'legend':
      return <LegendTemplate ref={ref} {...props} />;
    case 'billship':
      return <BillShipTemplate ref={ref} {...props} />;
    case 'classic':
    default:
      return <ClassicTemplate ref={ref} {...props} />;
  }
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
