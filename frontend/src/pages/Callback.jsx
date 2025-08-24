import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Callback() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      console.log("Discord code:", code);
      // Next: exchange code for token
    }
  }, [location]);

  return <h2>Logging in with Discord...</h2>;
}
