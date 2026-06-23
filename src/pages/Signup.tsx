import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { User } from '../types';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

export const SignupPage = ({ onSwitchToLogin }: SignupPageProps) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'agent' | 'broker'>('agent');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName,
      });

      // Create Firestore user document
      const userDoc: User = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...userDoc,
        createdAt: serverTimestamp(),
      });

      // Auth state will be handled by useAuth hook
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">
              Join RealEstateOS
            </h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Juan Dela Cruz"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Account Type
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'agent' | 'broker')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg
                  focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="agent">Real Estate Agent</option>
                <option value="broker">Broker</option>
              </select>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
