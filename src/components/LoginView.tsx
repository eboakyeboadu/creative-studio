import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, Children } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { cn } from '../lib/utils';
import { ArrowRight, Mail, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useInView, Variants, Transition } from "motion/react";
import confetti from "canvas-confetti";
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti";

// --- CONFETTI LOGIC ---
type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null
const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      if (instanceRef.current) return
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
    } else {
      if (instanceRef.current) { instanceRef.current.reset(); instanceRef.current = null }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  React.useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- TEXT LOOP ANIMATION COMPONENT ---
export function TextLoop({ children, className, interval = 2, stopOnEnd = false }: { children: React.ReactNode[]; className?: string; interval?: number; stopOnEnd?: boolean; }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) { clearInterval(timer); return current; }
        return (current + 1) % items.length;
      });
    }, interval * 1000);
    return () => clearInterval(timer);
  }, [items.length, interval, stopOnEnd]);
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- BUILT-IN BLUR FADE ANIMATION COMPONENT ---
function BlurFade({ children, className, duration = 0.4, delay = 0, yOffset = 6, inView = true }: { children: React.ReactNode; className?: string; duration?: number; delay?: number; yOffset?: number; inView?: boolean; }) {
  const ref = useRef(null);
  const isInView = !inView || useInView(ref, { once: true, margin: "-50px" as any });
  return (
    <motion.div ref={ref} initial={{ y: yOffset, opacity: 0, filter: "blur(6px)" }} animate={isInView ? { y: 0, opacity: 1, filter: "blur(0px)" } : { y: yOffset, opacity: 0, filter: "blur(6px)" }} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// --- THEME-AWARE SVG GRADIENT BACKGROUND ---
const GradientBackground = () => (
    <>
        <style>{` @keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } } @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } } `}</style>
        <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <g style={{ animation: 'float1 20s ease-in-out infinite' }}><ellipse cx="200" cy="500" rx="250" ry="180" fill="var(--color-primary)" opacity="0.05" transform="rotate(-30 200 500)" style={{filter: 'blur(80px)'}}/></g>
            <g style={{ animation: 'float2 25s ease-in-out infinite' }}><circle cx="650" cy="450" r="150" fill="var(--color-destructive)" opacity="0.03" style={{filter: 'blur(80px)'}}/></g>
        </svg>
    </>
);

const GoogleIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5"> <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/> <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/> <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/> <path fill="#EB4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/> </svg> );

const modalSteps = [
    { message: "Authenticating...", icon: <Loader2 className="w-10 h-10 text-primary animate-spin" /> },
    { message: "Securing connection...", icon: <Loader2 className="w-10 h-10 text-primary animate-spin" /> },
    { message: "Welcome Aboard!", icon: <PartyPopper className="w-10 h-10 text-green-500" /> }
];

const AbstractLogo = () => (
    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 shadow-md shadow-red-500/20">
      <div className="absolute inset-0.5 rounded-[6px] border border-white/20" />
      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
    </div>
);

export const LoginView: React.FC = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, canEnterDemo, enterDemo } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authStep, setAuthStep] = useState<"email"|"password">("email");

  const unverified = user && !user.emailVerified && user.providerData.some((p: any) => p.providerId === 'password');
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success' | 'verify-email'>(unverified ? 'verify-email' : 'closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  
  const confettiRef = useRef<ConfettiRef>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;

  const handleGoogleLogin = async () => {
    // We launch Google Auth first to ensure the popup is caught in the direct user Trusted Event click context
    const authPromise = signInWithGoogle();
    
    setModalStatus('loading');
    setModalErrorMessage('');
    
    try {
      await authPromise;
      setTimeout(() => setModalStatus('success'), 500);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Authentication failed. Please try again.';
      if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in cancelled.';
      } else if (error?.message) {
        errorMessage = error.message.replace('Firebase: ', '');
      }
      setModalErrorMessage(errorMessage);
      setModalStatus('error');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalStatus !== 'closed' || authStep !== 'password') return;

    setModalStatus('loading');
    setModalErrorMessage('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, "New User");
        setModalStatus('verify-email');
      } else {
        await signInWithEmail(email, password);
        setTimeout(() => setModalStatus('success'), 500);
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Authentication failed. Please check your credentials and try again.';
      
      if (error?.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. We have automatically switched you to Sign In.';
        setIsSignUp(false); // Automatically switch them to Sign In mode
      } else if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. If you do not have an account, please sign up.';
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = 'Access temporarily disabled due to too many failed attempts. Try again later.';
      } else if (error?.message) {
        errorMessage = error.message.replace('Firebase: ', '');
      }

      setModalErrorMessage(errorMessage);
      setModalStatus('error');
    }
  };

  const handleProgressStep = () => {
    if (authStep === 'email' && isEmailValid) setAuthStep("password");
    else if (authStep === 'password' && isPasswordValid) handleFinalSubmit({ preventDefault: () => {} } as any);
  };

  const closeModal = async () => { 
    if (unverified) {
      await logout();
      setModalStatus('closed');
      setModalErrorMessage('');
      setAuthStep('email');
    } else {
      setModalStatus('closed'); 
      setModalErrorMessage(''); 
    }
  };

  useEffect(() => { if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 500); }, [authStep]);
  useEffect(() => {
      if (modalStatus === 'success' && confettiRef.current?.fire) {
          confettiRef.current.fire({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount: 50, origin: { x: 0, y: 1 }, angle: 60 });
          confettiRef.current.fire({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount: 50, origin: { x: 1, y: 1 }, angle: 120 });
      }
  }, [modalStatus]);

  return (
    <div className="bg-background min-h-screen w-full flex flex-col items-center justify-center overflow-hidden relative">
        <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
        
        <AnimatePresence>
            {modalStatus !== 'closed' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-card border border-border/40 shadow-xl rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 mx-4">
                        {(modalStatus === 'error' || modalStatus === 'success' || modalStatus === 'verify-email') && <button onClick={closeModal} className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>}
                        {modalStatus === 'error' && <>
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <p className="text-sm font-medium text-foreground text-center break-words max-w-[250px]">{modalErrorMessage}</p>
                            <button type="button" onClick={closeModal} className="mt-2 text-xs font-semibold px-4 py-2 bg-muted hover:bg-muted/80 rounded-full transition-colors">Try Again</button>
                        </>}
                        {modalStatus === 'verify-email' &&
                            <div className="flex flex-col items-center gap-4 text-center">
                                <Mail className="w-12 h-12 text-primary" />
                                <div>
                                  <p className="text-base font-semibold text-foreground">Verify Your Email</p>
                                  <p className="text-sm font-medium text-muted-foreground mt-2 break-words max-w-[250px]">We've sent a verification link to your email. Please check your inbox.</p>
                                </div>
                                <button type="button" onClick={closeModal} className="mt-2 text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-colors">Got it</button>
                            </div>
                        }
                        {modalStatus === 'loading' && 
                            <TextLoop interval={2} stopOnEnd={true}>
                                {modalSteps.slice(0, -1).map((step, i) => 
                                    <div key={i} className="flex flex-col items-center gap-4">
                                        {step.icon}
                                        <p className="text-sm font-medium text-muted-foreground">{step.message}</p>
                                    </div>
                                )}
                            </TextLoop>
                        }
                        {modalStatus === 'success' &&
                            <div className="flex flex-col items-center gap-4">
                                {modalSteps[modalSteps.length - 1].icon}
                                <p className="text-sm font-medium text-foreground">{modalSteps[modalSteps.length - 1].message}</p>
                            </div>
                        }
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <AbstractLogo />
        </div>

        <GradientBackground />
        
        <div className="relative z-10 w-full max-w-[340px] px-6">
            <AnimatePresence mode="wait">
                {authStep === "email" && <motion.div key="email-content" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full flex flex-col items-center gap-6">
                    <BlurFade delay={0.1} className="w-full"><div className="text-center"><h2 className="text-3xl font-bold tracking-tight text-foreground">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2></div></BlurFade>
                    <BlurFade delay={0.2}><p className="text-sm text-center text-muted-foreground">{isSignUp ? 'Unlock powerful tools to build and scale your work.' : 'Sign in to access your studio.'}</p></BlurFade>
                    <BlurFade delay={0.3} className="w-full">
                        <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 w-full bg-card hover:bg-card/60 border border-border/50 text-foreground py-3.5 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <GoogleIcon />
                            <span className="font-medium text-[15px]">Continue with Google</span>
                        </button>
                    </BlurFade>
                    <BlurFade delay={0.4} className="w-full"><div className="flex items-center w-full gap-3 opacity-60 my-2"><hr className="flex-1 border-border"/><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">OR EMAIL</span><hr className="flex-1 border-border"/></div></BlurFade>
                    {canEnterDemo && <BlurFade delay={0.5} className="w-full"><button type="button" onClick={enterDemo} className="w-full text-center text-[13px] font-semibold text-primary hover:underline py-2">Explore the demo (no sign-in)</button></BlurFade>}
                </motion.div>}
                
                {authStep === "password" && <motion.div key="password-title" initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full flex flex-col items-center text-center gap-3">
                    <BlurFade delay={0} className="w-full"><h2 className="text-3xl font-bold tracking-tight text-foreground">{isSignUp ? 'Secure Account' : 'Enter Password'}</h2></BlurFade>
                    <BlurFade delay={0.1}><p className="text-sm text-muted-foreground">{isSignUp ? 'Create a secure password.' : 'Welcome back.'}</p></BlurFade>
                </motion.div>}
            </AnimatePresence>
            
            <form onSubmit={handleFinalSubmit} className="mt-4 w-full flex flex-col items-center gap-5">
                  <AnimatePresence>
                     <motion.div key="email-fields" transition={{ duration: 0.3 }} className="w-full relative">
                         {authStep === "password" && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-6 left-1"><label className="text-xs font-medium text-muted-foreground">Email</label></motion.div>}
                         <div className={cn("flex flex-col gap-4 transition-all w-full", authStep === 'password' && "opacity-60")}>
                             <div className="relative flex items-center w-full h-12 bg-card border border-border/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all shadow-sm">
                                 <div className="absolute left-3.5"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                                 <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleProgressStep(); } }} disabled={authStep !== 'email'} className="w-full bg-transparent h-full pl-10 pr-12 text-sm outline-none text-foreground placeholder:text-muted-foreground disabled:bg-muted/10" />
                                 {authStep === 'email' && (
                                     <button type="button" onClick={handleProgressStep} disabled={!isEmailValid} className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 transition-colors">
                                         <ArrowRight className="w-4 h-4" />
                                     </button>
                                 )}
                             </div>
                         </div>
                     </motion.div>
                 </AnimatePresence>

                 <AnimatePresence>
                     {authStep === "password" && (
                         <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full overflow-visible flex flex-col gap-4 pt-1">
                              <div className="relative w-full">
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-6 left-1"><label className="text-xs font-medium text-muted-foreground">Password</label></motion.div>
                                  <div className="relative flex items-center w-full h-12 bg-card border border-border/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all shadow-sm mt-3">
                                      <div className="absolute left-3.5">
                                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none rounded-sm">
                                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                          </button>
                                      </div>
                                      <input ref={passwordInputRef} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleProgressStep(); } }} className="w-full bg-transparent h-full pl-10 pr-12 text-[15px] outline-none text-foreground placeholder:text-muted-foreground" />
                                      <button type="submit" disabled={!isPasswordValid} className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 transition-colors">
                                          <ArrowRight className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                              <button type="button" onClick={() => setAuthStep('email')} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"><ArrowLeft className="w-3 h-3" /> Back</button>
                         </motion.div>
                     )}
                 </AnimatePresence>
            </form>

            <AnimatePresence>
              {authStep === "email" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 text-center">
                      <button type="button" onClick={() => { setIsSignUp(!isSignUp); setModalErrorMessage(''); setEmail(''); }} className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                      </button>
                  </motion.div>
              )}
            </AnimatePresence>
        </div>
    </div>
  );
};

