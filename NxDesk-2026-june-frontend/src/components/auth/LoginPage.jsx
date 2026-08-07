
import React from 'react';
import Header from './Header';
import LoginForm from './LoginForm';
import login_side_image from '../../assets/patil_login_logo.png'


const LoginPage = () => {
    return (
        <div className='flex h-screen'>
            <div className='flex-1 bg-cover bg-green-200 flex justify-center items-center'>
                <img
                    src={login_side_image}
                    alt="Illustration"
                    className="object-cover w-full h-full rounded-lg md:rounded-none mx-4 md:mx-12 lg:mx-0"
                />
            </div>
            <div className="flex-1 bg-white-500 min-h-full flex flex-col items-center justify-center">
                <LoginForm />
            </div>

        </div>
    );
};

export default LoginPage;