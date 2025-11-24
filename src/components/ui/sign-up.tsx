import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, Children } from "react";
import { ArrowRight, Mail, Gem, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper } from "lucide-react";
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion";
import SnowballSpinner from "../SnowballSpinner";

import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti"
import confetti from "canvas-confetti"

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
      if (instanceRef.current) {
        instanceRef.current.reset?.()
        instanceRef.current = null
      }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type IntersectionMargin = `${number}${"px" | "%"}` | `${number}${"px" | "%"} ${number}${"px" | "%"}` | `${number}${"px" | "%"} ${number}${"px" | "%"} ${number}${"px" | "%"}` | `${number}${"px" | "%"} ${number}${"px" | "%"} ${number}${"px" | "%"} ${number}${"px" | "%"}`;

interface BlurFadeProps { children: React.ReactNode; className?: string; variant?: { hidden: { y: number }; visible: { y: number } }; duration?: number; delay?: number; yOffset?: number; inView?: boolean; inViewMargin?: IntersectionMargin; blur?: string; }
function BlurFade({ children, className, variant, duration = 0.4, delay = 0, yOffset = 6, inView = true, inViewMargin = "-50px", blur = "6px" }: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden" variants={combinedVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: 'default' | 'sm' | 'icon';
}

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, children, size = 'default', ...props }, ref) => {
    const sizeClasses = {
      default: 'px-6 py-3.5 text-base',
      sm: 'px-4 py-2 text-sm',
      icon: 'p-2.5 w-10 h-10 flex items-center justify-center'
    };

    return (
      <button
        ref={ref}
        className={cn("shiny-cta", sizeClasses[size], className)}
        {...props}
      >
        <span className="flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";

const GradientBackground = () => (
    <div
        className="absolute inset-0 z-0"
        style={{
            background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)",
        }}
    />
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg> );

const modalSteps = [
    { message: "Signing you up...", icon: <SnowballSpinner size="sm" /> },
    { message: "Onboarding you...", icon: <SnowballSpinner size="sm" /> },
    { message: "Finalizing...", icon: <SnowballSpinner size="sm" /> },
    { message: "Welcome Aboard!", icon: <PartyPopper className="w-12 h-12 text-green-500" /> }
];
const TEXT_LOOP_INTERVAL = 1.5;

const DefaultLogo = () => ( <div className="bg-[#aa80f3] text-white rounded-md p-1.5"> <Gem className="h-4 w-4" /> </div> );

interface AuthComponentProps {
  logo?: React.ReactNode;
  brandName?: string;
  onSignUpSuccess?: () => void;
  onGoogleSignIn?: () => void;
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: Error | null } | void>;
}

export const AuthComponent = ({ logo = <DefaultLogo />, brandName = "EaseMize", onSignUpSuccess, onGoogleSignIn, onEmailSignUp }: AuthComponentProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authStep, setAuthStep] = useState("email");
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success'>('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length >= 6;

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
        const particleCount = 50;
        fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
        fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  const startSuccessSequence = () => {
    const loadingStepsCount = modalSteps.length - 1;
    const totalDuration = loadingStepsCount * TEXT_LOOP_INTERVAL * 1000;
    setTimeout(() => {
        fireSideCanons();
        setModalStatus('success');
        if (onSignUpSuccess) {
          setTimeout(() => {
            onSignUpSuccess();
          }, 1500);
        }
    }, totalDuration);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalStatus !== 'closed' || authStep !== 'confirmPassword' || isSubmitting) return;

    if (password !== confirmPassword) {
        setModalErrorMessage("Passwords do not match!");
        setModalStatus('error');
    }

    if (password !== confirmPassword) return;

    if (!onEmailSignUp) {
        setModalErrorMessage('Sign up is unavailable. Please try again later.');
        setModalStatus('error');
        return;
    }

    setIsSubmitting(true);
    setModalErrorMessage('');
    setModalStatus('loading');

    try {
        const result = await onEmailSignUp(email, password);
        const signUpError = (result as { error?: Error | null } | void)?.error;
        if (signUpError) throw signUpError;

        startSuccessSequence();
    } catch (error) {
        setModalErrorMessage(error instanceof Error ? error.message : 'Failed to sign up. Please try again.');
        setModalStatus('error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleProgressStep = () => {
    if (authStep === 'email') {
        if (isEmailValid) setAuthStep("password");
    } else if (authStep === 'password') {
        if (isPasswordValid) setAuthStep("confirmPassword");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleProgressStep();
    }
  };

  const handleGoBack = () => {
    if (authStep === 'confirmPassword') {
        setAuthStep('password');
        setConfirmPassword('');
    }
    else if (authStep === 'password') setAuthStep('email');
  };

  const closeModal = () => {
    setModalStatus('closed');
    setModalErrorMessage('');
  };

useEffect(() => {
    if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 500);
    else if (authStep === 'confirmPassword') setTimeout(() => confirmPasswordInputRef.current?.focus(), 500);
}, [authStep]);

useEffect(() => {
    if (modalStatus === 'success') {
        fireSideCanons();
    }
}, [modalStatus]);

  const Modal = () => (
    <AnimatePresence>
        {modalStatus !== 'closed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white/80 border-4 border-gray-200 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4 mx-2">
                    {(modalStatus === 'error' || modalStatus === 'success') && <button onClick={closeModal} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-900 transition-colors"><X className="w-5 h-5" /></button>}
                    {modalStatus === 'error' && <>
                        <AlertCircle className="w-12 h-12 text-red-500" />
                        <p className="text-lg font-medium text-gray-900">{modalErrorMessage}</p>
                        <ShinyButton onClick={closeModal} size="sm" className="mt-4">Try Again</ShinyButton>
                    </>}
                    {modalStatus === 'loading' &&
                        <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                            {modalSteps.slice(0, -1).map((step, i) =>
                                <div key={i} className="flex flex-col items-center gap-4">
                                    {step.icon}
                                    <p className="text-lg font-medium text-gray-900">{step.message}</p>
                                </div>
                            )}
                        </TextLoop>
                    }
                    {modalStatus === 'success' &&
                        <div className="flex flex-col items-center gap-4">
                            {modalSteps[modalSteps.length - 1].icon}
                            <p className="text-lg font-medium text-gray-900">{modalSteps[modalSteps.length - 1].message}</p>
                        </div>
                    }
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );

  return (
    <div className="bg-white min-h-screen w-screen flex flex-col">
        <style>{`
            @import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,500&display=swap");

            @property --gradient-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
            @property --gradient-angle-offset { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
            @property --gradient-percent { syntax: "<percentage>"; initial-value: 5%; inherits: false; }
            @property --gradient-shine { syntax: "<color>"; initial-value: white; inherits: false; }

            .shiny-cta {
                --shiny-cta-bg: #000000;
                --shiny-cta-bg-subtle: #1a1818;
                --shiny-cta-fg: #ffffff;
                --shiny-cta-highlight: #aa80f3;
                --shiny-cta-highlight-subtle: #9366e8;
                --animation: gradient-angle linear infinite;
                --duration: 3s;
                --shadow-size: 2px;
                --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
                isolation: isolate;
                position: relative;
                overflow: hidden;
                cursor: pointer;
                outline-offset: 4px;
                font-family: "Inter", sans-serif;
                font-weight: 500;
                border: 1px solid transparent;
                border-radius: 0.5rem;
                color: var(--shiny-cta-fg);
                background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box, conic-gradient(from calc(var(--gradient-angle) - var(--gradient-angle-offset)), transparent, var(--shiny-cta-highlight) var(--gradient-percent), var(--gradient-shine) calc(var(--gradient-percent) * 2), var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3), transparent calc(var(--gradient-percent) * 4)) border-box;
                box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
                transition: var(--transition);
                transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
            }
            .shiny-cta::before, .shiny-cta::after, .shiny-cta span::before {
                content: "";
                pointer-events: none;
                position: absolute;
                inset-inline-start: 50%;
                inset-block-start: 50%;
                translate: -50% -50%;
                z-index: -1;
            }
            .shiny-cta:active { translate: 0 1px; }
            .shiny-cta::before {
                --size: calc(100% - var(--shadow-size) * 3);
                --position: 2px;
                --space: calc(var(--position) * 2);
                width: var(--size);
                height: var(--size);
                background: radial-gradient(circle at var(--position) var(--position), white calc(var(--position) / 4), transparent 0) padding-box;
                background-size: var(--space) var(--space);
                background-repeat: space;
                mask-image: conic-gradient(from calc(var(--gradient-angle) + 45deg), black, transparent 10% 90%, black);
                border-radius: 0.5rem;
                opacity: 0.4;
                z-index: -1;
            }
            .shiny-cta::after {
                --animation: shimmer linear infinite;
                width: 100%;
                aspect-ratio: 1;
                background: linear-gradient(-50deg, transparent, var(--shiny-cta-highlight), transparent);
                mask-image: radial-gradient(circle at bottom, transparent 40%, black);
                opacity: 0.6;
            }
            .shiny-cta span { z-index: 1; }
            .shiny-cta span::before {
                --size: calc(100% + 1rem);
                width: var(--size);
                height: var(--size);
                box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
                opacity: 0;
                transition: opacity var(--transition);
                animation: calc(var(--duration) * 1.5) breathe linear infinite;
            }
            .shiny-cta, .shiny-cta::before, .shiny-cta::after {
                animation: var(--animation) var(--duration), var(--animation) calc(var(--duration) / 0.4) reverse paused;
                animation-composition: add;
            }
            .shiny-cta:is(:hover, :focus-visible) {
                --gradient-percent: 20%;
                --gradient-angle-offset: 95deg;
                --gradient-shine: var(--shiny-cta-highlight-subtle);
            }
            .shiny-cta:is(:hover, :focus-visible), .shiny-cta:is(:hover, :focus-visible)::before, .shiny-cta:is(:hover, :focus-visible)::after {
                animation-play-state: running;
            }
            .shiny-cta:is(:hover, :focus-visible) span::before { opacity: 1; }
            @keyframes gradient-angle { to { --gradient-angle: 360deg; } }
            @keyframes shimmer { to { rotate: 360deg; } }
            @keyframes breathe { from, to { scale: 1; } 50% { scale: 1.2; } }
            @media (prefers-color-scheme: light) {
                .shiny-cta {
                    --shiny-cta-bg: #ffffff;
                    --shiny-cta-bg-subtle: #f0f0f0;
                    --shiny-cta-fg: #000000;
                    --shiny-cta-highlight: #aa80f3;
                    --shiny-cta-highlight-subtle: #9366e8;
                }
            }

            input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; }
            input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; }
            input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px transparent inset !important;
                -webkit-text-fill-color: #000 !important;
                background-color: transparent !important;
                background-clip: content-box !important;
                transition: background-color 5000s ease-in-out 0s !important;
                color: #000 !important;
                caret-color: #000 !important;
            }
        `}</style>

        <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
        <Modal />

        <div className={cn( "fixed top-4 left-4 z-20 flex items-center gap-2", "md:left-1/2 md:-translate-x-1/2" )}>
            {logo}
            <h1 className="text-base font-bold text-gray-900">{brandName}</h1>
        </div>

        <div className={cn("flex w-full flex-1 h-full items-center justify-center", "relative overflow-hidden")}>
            <GradientBackground />
            <fieldset disabled={modalStatus !== 'closed'} className="relative z-10 flex flex-col items-center gap-8 w-[280px] mx-auto p-4">
                <AnimatePresence mode="wait">
                    {authStep === "email" && <motion.div key="email-content" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center gap-4">
                        <BlurFade delay={0.25 * 1} className="w-full"><div className="text-center"><p style={{ fontFamily: '"Sulphur Point", sans-serif' }} className="font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-gray-900 whitespace-nowrap">The Best Learning Decision You'll Ever Make</p></div></BlurFade>
                        <BlurFade delay={0.25 * 2}><p className="text-sm font-medium text-gray-600">Continue with</p></BlurFade>
                        <BlurFade delay={0.25 * 3}><div className="flex items-center justify-center gap-4 w-full">
                            <ShinyButton onClick={onGoogleSignIn} className="flex items-center justify-center gap-2" size="sm"><GoogleIcon /><span className="font-semibold">Google</span></ShinyButton>
                        </div></BlurFade>
                        <BlurFade delay={0.25 * 4} className="w-[300px]"><div className="flex items-center w-full gap-2 py-2"><hr className="w-full border-gray-300"/><span className="text-xs font-semibold text-gray-600">OR</span><hr className="w-full border-gray-300"/></div></BlurFade>
                    </motion.div>}
                    {authStep === "password" && <motion.div key="password-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                        <BlurFade delay={0} className="w-full"><div className="text-center"><p style={{ fontFamily: '"Sulphur Point", sans-serif' }} className="font-light text-4xl sm:text-5xl tracking-tight text-gray-900 whitespace-nowrap">Create your password</p></div></BlurFade>
                        <BlurFade delay={0.25 * 1}><p className="text-sm font-medium text-gray-600">Your password must be at least 6 characters long.</p></BlurFade>
                    </motion.div>}
                     {authStep === "confirmPassword" && <motion.div key="confirm-title" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full flex flex-col items-center text-center gap-4">
                         <BlurFade delay={0} className="w-full"><div className="text-center"><p style={{ fontFamily: '"Sulphur Point", sans-serif' }} className="font-light text-4xl sm:text-5xl tracking-tight text-gray-900 whitespace-nowrap">One Last Step</p></div></BlurFade>
                         <BlurFade delay={0.25 * 1}><p className="text-sm font-medium text-gray-600">Confirm your password to continue</p></BlurFade>
                    </motion.div>}
                </AnimatePresence>

                <form onSubmit={handleFinalSubmit} className="w-[300px] space-y-6">
                     <AnimatePresence>
                        {authStep !== 'confirmPassword' && <motion.div key="email-password-fields" exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full space-y-6">
                            <BlurFade delay={authStep === 'email' ? 0.25 * 5 : 0} inView={true} className="w-full">
                                <div className="relative w-full">
                                    <AnimatePresence>
                                        {authStep === "password" && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }} className="absolute -top-6 left-4 z-10"><label className="text-xs text-gray-600 font-semibold">Email</label></motion.div>}
                                    </AnimatePresence>
                                    <div className="relative flex items-center w-full bg-white/70 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#aa80f3] focus-within:border-transparent transition-all">
                                        <div className={cn( "flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out", email.length > 20 && authStep === 'email' ? "w-0 mr-0" : "w-5 mr-3" )}><Mail className="h-5 w-5 text-gray-600 flex-shrink-0" /></div>
                                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} className={cn("flex-grow bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none", isEmailValid && authStep === 'email' ? "pr-2" : "pr-0")} />
                                        <div className={cn( "flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isEmailValid && authStep === 'email' ? "w-10 ml-2" : "w-0" )}><ShinyButton type="button" onClick={handleProgressStep} size="icon" aria-label="Continue with email"><ArrowRight className="w-5 h-5" /></ShinyButton></div>
                                    </div>
                                </div>
                            </BlurFade>
                            <AnimatePresence>
                                {authStep === "password" && <BlurFade key="password-field" className="w-full">
                                    <div className="relative w-full">
                                        <AnimatePresence>
                                            {password.length > 0 && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10"><label className="text-xs text-gray-600 font-semibold">Password</label></motion.div>}
                                        </AnimatePresence>
                                        <div className="relative flex items-center w-full bg-white/70 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#aa80f3] focus-within:border-transparent transition-all">
                                            <div className="flex-shrink-0 flex items-center justify-center w-5 mr-3">
                                                {isPasswordValid ? <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="text-gray-600 hover:text-gray-900 transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button> : <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />}
                                            </div>
                                            <input ref={passwordInputRef} type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} className="flex-grow bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none" />
                                            <div className={cn( "flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isPasswordValid ? "w-10 ml-2" : "w-0" )}><ShinyButton type="button" onClick={handleProgressStep} size="icon" aria-label="Submit password"><ArrowRight className="w-5 h-5" /></ShinyButton></div>
                                        </div>
                                    </div>
                                    <BlurFade inView delay={0.2}><button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"><ArrowLeft className="w-4 h-4" /> Go back</button></BlurFade>
                                </BlurFade>}
                            </AnimatePresence>
                        </motion.div>}
                    </AnimatePresence>
                    <AnimatePresence>
                        {authStep === 'confirmPassword' && <BlurFade key="confirm-password-field" className="w-full">
                            <div className="relative w-full">
                                <AnimatePresence>
                                    {confirmPassword.length > 0 && <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="absolute -top-6 left-4 z-10"><label className="text-xs text-gray-600 font-semibold">Confirm Password</label></motion.div>}
                                </AnimatePresence>
                                <div className="relative flex items-center w-full bg-white/70 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#aa80f3] focus-within:border-transparent transition-all">
                                    <div className="flex-shrink-0 flex items-center justify-center w-5 mr-3">
                                        {isConfirmPasswordValid ? <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-600 hover:text-gray-900 transition-colors">{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button> : <Lock className="h-5 w-5 text-gray-600 flex-shrink-0" />}
                                    </div>
                                    <input ref={confirmPasswordInputRef} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-grow bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none" />
                                    <div className={cn( "flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out", isConfirmPasswordValid ? "w-10 ml-2" : "w-0" )}><ShinyButton type="submit" size="icon" aria-label="Finish sign-up"><ArrowRight className="w-5 h-5" /></ShinyButton></div>
                                </div>
                            </div>
                            <BlurFade inView delay={0.2}><button type="button" onClick={handleGoBack} className="mt-4 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"><ArrowLeft className="w-4 h-4" /> Go back</button></BlurFade>
                        </BlurFade>}
                    </AnimatePresence>
                </form>
            </fieldset>
        </div>
    </div>
  );
};
