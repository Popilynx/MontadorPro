import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Geolocator from './Geolocator';

const Layout = ({ children, title }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('montador') || '{}');

    return (
        <div className="flex min-h-screen bg-background text-primary-light font-sans overflow-x-hidden relative">
            <div className="noise-overlay"></div>
            
            {/* Overlay escurecido para fechar sidebar no mobile */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ${
                    isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                <Header title={title} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="p-4 sm:p-6 md:p-12 xl:p-16 animate-[fade-in_0.8s_ease-out]">
                    {children}
                </main>
            </div>
            {user.id && <Geolocator />}
        </div>
    );
};

export default Layout;
