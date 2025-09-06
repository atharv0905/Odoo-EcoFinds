import { useAuth } from "@/hooks/auth-context";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
    const { user } = useAuth()
    const navigator = useNavigate();
    useEffect(() => {
        if (user) {
            navigator("/dashboard");
        }else{
            navigator("/login");
        }
    }, [user, navigator]);
    return (
        <>
            <h1>this is a test app</h1>
            <Link to="/dashboard">Login</Link>
        </>
    );
};
export default Home;
