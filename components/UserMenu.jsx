import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '../lib/api/auth';
import { useSubscription } from '../lib/api/subscription';
import apiClient from '../lib/axios';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  
  // Use React Query to get user profile data
  const { data: user, isLoading, error } = useProfile();
  const { data: subscription } = useSubscription();

  // Fallback user object if data is not available yet
  const userData = user || { name: '', id: '', phone: '', role: '' };

  // Subscription countdown timer
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!subscription || !subscription.active || !subscription.date_of_expiration) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiration = new Date(subscription.date_of_expiration);
      const diff = expiration - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [subscription]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/');
    }
  };

  const handleManageAssistants = () => {
    router.push('/manage_assistants');
  };

  const handleEditProfile = () => {
    router.push('/manage_assistants/edit_my_profile');
  };

  const handleContactDeveloper = () => {
    router.push('/contact_developer');
  };

  const handleSubscriptionDashboard = () => {
    router.push('/subscription_dashboard');
  };

  return (
    <div style={{ position: 'relative', marginRight: 32 }} ref={menuRef}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: open ? '0 2px 8px rgba(31,168,220,0.15)' : 'none',
          border: open ? '2px solid #1FA8DC' : '2px solid #e9ecef',
          transition: 'box-shadow 0.2s, border 0.2s'
        }}
        onClick={() => setOpen((v) => !v)}
        title={userData.name || userData.id}
      >
        {/* Use user image if available, else fallback to initial */}
        <span style={{ 
          fontWeight: 700, 
          fontSize: 22, 
          color: '#1FA8DC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          lineHeight: 1,
          textAlign: 'center'
        }}>
          {userData.name ? userData.name[0].toUpperCase() : (userData.id ? userData.id[0].toUpperCase() : 'U')}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: 54,
          right: 0,
          minWidth: 270,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(31,168,220,0.18)',
          border: '1.5px solid #e9ecef',
          zIndex: 100,
          padding: '0 0 8px 0',
        }}>
          <div style={{
            padding: '18px 20px 12px 20px',
            borderBottom: '1px solid #e9ecef',
            textAlign: 'left',
            marginBottom: 8
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1FA8DC', marginBottom: 2 }}>{userData.name || userData.id}</div>
            <div style={{ color: '#495057', fontSize: 15, fontWeight: 600 }}>
              {userData.id ? `ID: ${userData.id}` : 'No ID'}
            </div>
          </div>
          {subscription && (
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid #e9ecef',
              marginBottom: 8
            }}>
              {subscription.active && timeRemaining ? (
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#495057',
                  lineHeight: 1.4
                }}>
                  <div style={{ marginBottom: 4, color: '#6c757d', fontSize: 12 }}>Subscription time remaining:</div>
                  <div style={{ 
                    fontFamily: 'Courier New, monospace',
                    letterSpacing: 0.5
                  }}>
                    <span style={{ color: '#1FA8DC' }}>{String(timeRemaining.days).padStart(2, '0')}</span>
                    <span style={{ color: '#ef4a4a' }}> days : </span>
                    <span style={{ color: '#1FA8DC' }}>{String(timeRemaining.hours).padStart(2, '0')}</span>
                    <span style={{ color: '#ef4a4a' }}> hours : </span>
                    <span style={{ color: '#1FA8DC' }}>{String(timeRemaining.minutes).padStart(2, '0')}</span>
                    <span style={{ color: '#ef4a4a' }}> min : </span>
                    <span style={{ color: '#1FA8DC' }}>{String(timeRemaining.seconds).padStart(2, '0')}</span>
                    <span style={{ color: '#ef4a4a' }}> sec</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#dc3545',
                  lineHeight: 1.4
                }}>
                  Subscription Expired
                </div>
              )}
            </div>
          )}
          <button style={menuBtnStyle} onClick={handleLogout}>Logout</button>
          {(userData.role === 'admin' || userData.role === 'developer') && (
            <button style={menuBtnStyle} onClick={handleManageAssistants}>Manage Assistants</button>
          )}
          {userData.role === 'developer' && (
            <button style={menuBtnStyle} onClick={handleSubscriptionDashboard}>Subscription Dashboard</button>
          )}
          <button style={menuBtnStyle} onClick={handleEditProfile}>Edit My Profile</button>
          <button style={menuBtnStyle} onClick={handleContactDeveloper}>Contact Developer</button>
        </div>
      )}
    </div>
  );
}

const menuBtnStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#1FA8DC',
  fontWeight: 700,
  fontSize: 16,
  padding: '10px 20px',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 8,
  transition: 'background 0.15s',
  marginBottom: 2,
  outline: 'none',
}; 