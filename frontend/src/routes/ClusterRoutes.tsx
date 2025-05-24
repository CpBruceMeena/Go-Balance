import { Routes, Route } from 'react-router-dom';
import ClusterManagement from '../components/ClusterManagement';
import NodeDetails from '../pages/NodeDetails';

const ClusterRoutes: React.FC = () => (
  <Routes>
    <Route path="/clusters" element={<ClusterManagement />} />
    <Route path="/clusters/:clusterId/nodes/:nodeId" element={<NodeDetails />} />
  </Routes>
);

export default ClusterRoutes; 