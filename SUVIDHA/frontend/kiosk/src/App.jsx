import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import HomeScreen from './screens/HomeScreen';
import PayBillsScreen from './screens/PayBills/PayBillsScreen';
import BillDetailScreen from './screens/PayBills/BillDetailScreen';
import PaymentMethodScreen from './screens/PayBills/PaymentMethodScreen';
import PaymentSuccessScreen from './screens/PayBills/PaymentSuccessScreen';
import FormsScreen from './screens/Forms/FormsScreen';
import FormFillScreen from './screens/Forms/FormFillScreen';
import FormSuccessScreen from './screens/Forms/FormSuccessScreen';
import GrievanceScreen from './screens/Grievance/GrievanceScreen';
import GrievanceSuccessScreen from './screens/Grievance/GrievanceSuccessScreen';
import { useHeartbeat } from './services/heartbeatService';
import { useHardwareWatcher } from './services/hardwareService';

export default function App() {
    useHeartbeat();
    useHardwareWatcher();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/pay" element={<PayBillsScreen />} />
                <Route path="/pay/detail" element={<BillDetailScreen />} />
                <Route path="/pay/method" element={<PaymentMethodScreen />} />
                <Route path="/pay/success" element={<PaymentSuccessScreen />} />
                <Route path="/forms" element={<FormsScreen />} />
                <Route path="/forms/fill" element={<FormFillScreen />} />
                <Route path="/forms/success" element={<FormSuccessScreen />} />
                <Route path="/grievance" element={<GrievanceScreen />} />
                <Route path="/grievance/success" element={<GrievanceSuccessScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
