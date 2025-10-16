
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { setActiveLink } from '../store/navbarSlice';

const TopNavbar = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const activeLink = useSelector((state) => state.navbar.activeLink);
    useEffect(() => {
        const pathMap = {
            'your-work': 'Your work',
            'dashboard': 'Dashboard',
            'create-issue': 'Create Issue',
            'teams': 'Teams'
        };
        const currentPath = location.pathname.split('/')[1];
        if (pathMap[currentPath]) {
            dispatch(setActiveLink(pathMap[currentPath]));
        }
    }, [location.pathname, dispatch]);

    return (

            <nav className="bg-gray-100 my-1 pt-6">
                <div className="container mx-auto flex justify-items-start items-center">
                    <div className="flex space-x-4 ml-4">
                        {['Your work', 'Dashboard', 'Create Issue', 'Teams'].map((link) => (
                            <Link
                                key={link}
                                to={`/${link.toLowerCase().replace(' ', '-')}`}
                                className={`text-gray-600 pl-4 pr-4 ${activeLink === link ? 'font-bold text-red-800' : ''}`}
                                onClick={() => dispatch(setActiveLink(link))}
                            >
                                {link}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>
    );
};

export default TopNavbar;