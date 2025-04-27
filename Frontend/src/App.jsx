import './index.css';
import Layout from './dashboard';
import Auth from './auth/index';
import { Route, Routes } from 'react-router-dom';
import PrivateRoute from './HOC/PrivateRoute';
import Homepage from './Home/homepage';
// Import the page components needed for nested routes
import Dashboard from './dashboard/pages/Homepage/Dashboard';
import ChatbotUI from './dashboard/pages/chatbot';
import FertilizerPredict from './dashboard/pages/YieldPrediction/FertilizerPredict';
import FertilizerRecommend from './dashboard/pages/FertilizerRecommend/FertilizerRecommend';
import MedicalImageAnalysis from './dashboard/pages/diseasesDetection';
import CropRecommend from './dashboard/pages/CropRecommendation/CropRecommend';
import { FarmAnalytics } from './dashboard/pages/Contacts/Contact'; // Assuming this is the inventory component
import FarmerProfile from './dashboard/pages/ProfilePage';
// import NotFound from './NotFound/NotFound';
import 'regenerator-runtime/runtime'

function App() {
  // No need to check token here, PrivateRoute will handle it
  return (
    <Routes> {/* Define all routes within a single Routes block */}
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/auth" element={<Auth />} />

      {/* Layout Route for Protected Areas */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Layout /> {/* Layout component renders sidebar, header, and Outlet */}
          </PrivateRoute>
        }
      >
        {/* Nested routes rendered inside Layout's Outlet */}
        <Route index element={<Dashboard />} /> {/* Matches /dashboard */}
        <Route path="bot" element={<ChatbotUI />} /> {/* Matches /dashboard/bot */}
        <Route path="diseases" element={<MedicalImageAnalysis />} /> {/* Matches /dashboard/diseases */}
        <Route path="yield" element={<FertilizerPredict />} /> {/* Matches /dashboard/yield */}
        <Route path="fertilizers" element={<FertilizerRecommend />} /> {/* Matches /dashboard/fertilizers */}
        <Route path="crop-recommendation" element={<CropRecommend />} /> {/* Matches /dashboard/crop-recommendation */}
        <Route path="inventory" element={<FarmAnalytics />} /> {/* Matches /dashboard/inventory */}
      </Route> 

      {/* Standalone Protected Route (Example, adjust if needed) */}
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <FarmerProfile /> 
          </PrivateRoute>
        }
      />

      {/* Catch-all or Not Found Route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;
