// frontend/src/components/Logout.js
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.info('You have been logged out.');
        navigate('/login');
    };

    return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
