import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Mail, Lock, User, Loader2, Globe, Github } from 'lucide-react';
import { STUDIO_LOGO_RED } from '../constants';

interface LocalSignupViewProps {
  t: any;
  setCurrentView: (view: any) => void;
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveAccount: (account: any) => void;
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function LocalSignupView({ t, setCurrentView, setAccounts, setActiveAccount, addToast }: LocalSignupViewProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center bg-secondary/10 p-4 min-h-screen">
      <Card className="w-full max-w-md premium-card animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <img src={STUDIO_LOGO_RED} alt="Creative Studio" className="h-14 w-auto mix-blend-multiply dark:mix-blend-screen" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t.signUp}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t.createAccount}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder={t.fullName} 
                className="pl-10 h-11 focus-visible:ring-foreground/20"
                disabled={isLoggingIn}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="email" 
                placeholder="name@example.com" 
                className="pl-10 h-11 focus-visible:ring-foreground/20"
                disabled={isLoggingIn}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 h-11 focus-visible:ring-foreground/20"
                disabled={isLoggingIn}
              />
            </div>
          </div>
          <Button 
            className="w-full h-11 font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoggingIn}
            onClick={() => {
              setIsLoggingIn(true);
              setTimeout(() => {
                setCurrentView('home');
                const newAcc = {
                  id: `acc-${Date.now()}`,
                  name: 'New User',
                  email: 'new.user@example.com',
                  logo: 'NU',
                  role: t.editor
                };
                setAccounts(prev => [...prev, newAcc]);
                setActiveAccount(newAcc);
                setIsLoggingIn(false);
                addToast(t.successfullySignedIn, "success");
              }, 1000);
            }}
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {isLoggingIn ? t.creatingAccount : t.signUp}
          </Button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">{t.orContinueWith}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-11 font-medium hover:bg-secondary/50"
              disabled={isLoggingIn}
              onClick={() => addToast(t.connectingTo.replace('{provider}', 'Google'), "info")}
            >
              <Globe className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button 
              variant="outline" 
              className="h-11 font-medium hover:bg-secondary/50"
              disabled={isLoggingIn}
              onClick={() => addToast(t.connectingTo.replace('{provider}', 'GitHub'), "info")}
            >
              <Github className="w-5 h-5 mr-2" />
              GitHub
            </Button>
          </div>

          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground"
            disabled={isLoggingIn}
            onClick={() => setCurrentView('home')}
          >
            {t.cancel}
          </Button>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              {t.alreadyHaveAccount}{" "}
              <button 
                className="text-primary font-semibold hover:underline"
                onClick={() => setCurrentView('login')}
              >
                {t.signIn}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

