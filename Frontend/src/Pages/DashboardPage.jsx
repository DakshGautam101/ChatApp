import React from 'react'
import useAuthStore from '../Stores/useAuthStore'
import { Power } from 'lucide-react';
import { Button } from '../components/ui/button';
import UserList from '../components/UserList';
import Notifications from '../components/Notifications';
import Invitation from '../components/Invitation';

const DashboardPage = () => {

    const {user, logout } = useAuthStore();
    
    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    }
    
    return (
        <div>
            <div className='flex items-center justify-between p-6'>
                <div className='flex flex-col items-start gap-2'>
                    <h1 className='text-2xl font-bold'>Welcome, {user?.username || "User"}</h1>
                    <p className='text-gray-600'>Email: {user?.email || "N/A"}</p>
                </div>
                <Button onClick={handleLogout} className='flex gap-2'>
                    <Power className='w-4 h-4' />
                    Logout
                </Button>
            </div>

            <div className='p-6'>
                <UserList />
            </div>

            <Notifications />
            <Invitation/>
        </div>
    )
}

export default DashboardPage
