import React from 'react'
import { Route , Routes } from 'react-router-dom';
import useAuthStore from './Stores/useAuthStore';
import { useEffect } from 'react';
import LoginPage from './Pages/LoginPage';
import { Toaster } from 'react-hot-toast';
import SignUpPage from './Pages/SignUpPage';
import { EmailVerification } from './Pages/EmailVerification';
import DashboardPage from './Pages/DashboardPage';


const App = () => {

  const { isAuthenticated } = useAuthStore();
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // on app mount validate cookie-based session
    checkAuth();
  }, []);

  return (
    <>
      {isLoading ? <div className='p-6'>Checking session...</div> : null}
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <DashboardPage /> : <LoginPage />}
          />
          <Route 
          path='/login'
          element = <LoginPage/>
          />
          <Route
            path="/signup"
            element={<SignUpPage />}
          />
          <Route 
          path="/verify-email"
          element={<EmailVerification/>}
          />
        </Routes>
        <Toaster/>
    </>
  )
}

export default App
