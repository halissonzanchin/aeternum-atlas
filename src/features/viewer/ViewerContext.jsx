import { createContext, useContext } from 'react';

const ViewerContext = createContext(null);

export const useViewer = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  return context;
};

export default ViewerContext;
