import { useState } from 'react';
import { LoginPage } from './Login';
import { SignupPage } from './Signup';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginPage onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupPage onSwitchToLogin={() => setIsLogin(true)} />
  );
};
