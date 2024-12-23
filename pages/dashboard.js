import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                router.push('/login');
            }
        };

        fetchUser();
    }, [router]);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="container">
            <h1>Welcome, {user.email}!</h1>
            {/* Diğer özellikleri burada ekleyebilirsiniz */}
        </div>
    );
};

export default Dashboard;
