import { getAuth, signOut } from 'firebase/auth';

export default function LogoutButton() {
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Optionally, redirect to login or home page
      window.location.href = '/';
    } catch (error) {
      alert('Error logging out.');
    }
  };

  return (
    <button type="button" onClick={handleLogout} >
      Log Out
    </button>
  );
}
