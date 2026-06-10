import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  GlassWater, 
  Utensils, 
  Music, 
  Compass, 
  Instagram, 
  Mail, 
  Globe, 
  Trash2, 
  CheckCircle, 
  Lock, 
  Menu, 
  X, 
  Send,
  Sparkles,
  Ticket,
  AlertCircle
} from 'lucide-react';

// Define Registration structure matching our server
interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  city: string;
  instagram: string;
  heardFrom: string;
  dietary: string;
  ticket: string;
  status: 'Pending Verification' | 'Verified';
  timestamp: string;
  transactionId?: string;
  screenshotImage?: string;
  aiVerified?: boolean;
  aiExtractedTransactionId?: string;
  aiExtractedAmount?: number;
  aiExtractedSenderName?: string;
  aiVerificationStatus?: 'verified' | 'unclear' | 'invalid' | 'not_analyzed';
  aiFeedback?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

// Load Razorpay checkout script once
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function App() {
  // Page routing state: 'home' | 'form' | 'success' | 'admin'
  const [currentTab, setCurrentTab] = useState<'home' | 'form' | 'success' | 'admin'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Generate floating background particles
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 2}px`,
      duration: `${Math.random() * 12 + 8}s`,
      delay: `${Math.random() * 10}s`
    }))
  );

  // Home Form Query states
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [querySuccess, setQuerySuccess] = useState(false);

  // Registration Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    city: '',
    instagram: '',
    heardFrom: '',
    dietary: 'No restrictions',
    ticket: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [consents, setConsents] = useState({
    c1: false,
    c2: false,
    c3: false,
    c4: false,
  });

  // Flow State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Admin states
  const [adminRegistrations, setAdminRegistrations] = useState<Registration[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Ticket Pricing config
  const pricingData = {
    t1: { name: 'Female Entry Pass', amount: 999, label: 'Standard Pass', sex: 'Female' },
    t2: { name: 'Male Entry Pass', amount: 1499, label: 'Standard Pass', sex: 'Male' },
    t3: { name: 'Couple Entry Pass (2 Persons)', amount: 1999, label: 'Standard Pass', sex: 'Couple' },
  };

  // Nav scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync route hash change to support directly landing on #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('home');
      }
    };
    handleHash(); // Run on mount
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch admin registrations list
  const fetchRegistrations = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/registrations');
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: Registration, b: Registration) => {
          if (a.status === 'Pending Verification' && b.status === 'Verified') return -1;
          if (a.status === 'Verified' && b.status === 'Pending Verification') return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        setAdminRegistrations(sorted);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'ignyt2026' || adminPassword === 'parth007') {
      setIsAdminAuthenticated(true);
      setAdminError('');
      fetchRegistrations();
    } else {
      setAdminError('Invalid authorization key');
    }
  };

  // Admin Verify registration (triggers verification email)
  const handleVerifyRegistration = async (id: string) => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchRegistrations();
        alert('Ticket successfully verified! Official confirmation email sent to attendee.');
      }
    } catch (err) {
      console.error('Error verifying registration:', err);
    }
  };

  // Admin Delete registration
  const handleDeleteRegistration = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/registration?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchRegistrations();
      }
    } catch (err) {
      console.error('Error deleting registration:', err);
    }
  };

  // Contact Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuerySubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: queryName,
          email: queryEmail,
          message: queryMessage
        })
      });
      if (res.ok) {
        setQuerySuccess(true);
        setQueryName('');
        setQueryEmail('');
        setQueryMessage('');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
    } finally {
      setQuerySubmitting(false);
    }
  };

  // Form Field Validation
  const validateRegistration = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    
    const ageNum = parseInt(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 18) {
      errors.age = 'Age must be 18 or above (Valid photo ID is mandatory)';
    }

    if (!formData.gender) errors.gender = 'Gender selection is required';
    
    const phoneClean = formData.phone.trim();
    const phoneDigits = phoneClean.replace(/\D/g, '');
    let isValidPhone = false;
    if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
      isValidPhone = true;
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) {
      isValidPhone = true;
    } else if (phoneDigits.length === 10) {
      isValidPhone = true;
    }

    if (!phoneClean) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhone) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Valid email is required';
    }

    if (!formData.city) errors.city = 'Coming city is required';
    if (!formData.heardFrom) errors.heardFrom = 'This field is required';
    if (!formData.ticket) errors.ticket = 'Please select a ticket option';

    const allConsented = Object.values(consents).every(val => val === true);
    if (!allConsented) {
      errors.consent = 'You must agree to all terms and conditions checkboxes to proceed';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger Registration flow → open payment modal
  const handleProceedToPayment = () => {
    if (!validateRegistration()) {
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        const el = document.getElementById(firstError);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setPaymentError('');
    setIsModalOpen(true);
  };

  // ─── RAZORPAY CHECKOUT FLOW ───────────────────────────────
  const handleRazorpayPayment = async () => {
    setPaymentError('');
    setSubmittingRegistration(true);

    try {
      const selectedPricing = pricingData[formData.ticket as keyof typeof pricingData];
      const amount = selectedPricing.amount;
      const ticketDescription = `${selectedPricing.name} — ₹${amount}`;

      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError('Could not load payment gateway. Please check your connection and try again.');
        setSubmittingRegistration(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        setPaymentError(errData.error || 'Could not start payment. Please try again.');
        setSubmittingRegistration(false);
        return;
      }

      const orderData = await orderRes.json();

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'IGNYT.CO',
        description: `${selectedPricing.name} — Summer Pool Party`,
        order_id: orderData.order_id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          ticket: ticketDescription,
        },
        theme: {
          color: '#C9A84C',
        },
        handler: async function (response: any) {
          // 4. Verify the payment signature on backend
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // 5. Save the verified registration
              await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  age: formData.age,
                  gender: formData.gender,
                  phone: formData.phone,
                  email: formData.email,
                  city: formData.city,
                  instagram: formData.instagram,
                  heardFrom: formData.heardFrom,
                  dietary: formData.dietary,
                  ticket: ticketDescription,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  paymentVerified: true,
                })
              });

              // 6. Show success screen
              setRegisteredEmail(formData.email);
              setIsModalOpen(false);
              setFormData({
                firstName: '', lastName: '', age: '', gender: '', phone: '',
                email: '', city: '', instagram: '', heardFrom: '',
                dietary: 'No restrictions', ticket: '',
              });
              setConsents({ c1: false, c2: false, c3: false, c4: false });
              setCurrentTab('success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setPaymentError('Payment could not be verified. If money was deducted, contact us on WhatsApp and we will sort it immediately.');
            }
          } catch (err) {
            console.error('Verify error:', err);
            setPaymentError('Payment verification failed. If money was deducted, contact us on WhatsApp right away.');
          } finally {
            setSubmittingRegistration(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmittingRegistration(false);
            setPaymentError('Payment was cancelled. You can try again, or reach us on WhatsApp if you need help.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setSubmittingRegistration(false);
        setPaymentError(`Payment failed: ${response.error?.description || 'Please try again'}. Or reach us on WhatsApp for help.`);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Payment flow error:', err);
      setPaymentError(`Something went wrong: ${err.message || err}. Please try again or contact us on WhatsApp.`);
      setSubmittingRegistration(false);
    }
  };

  // Helper utility to safely navigate back to home
  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentTab('home');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#060606] text-[#F0EBE3] relative noise-overlay font-sans select-none pb-12">
      
      {/* BACKGROUND FLOATING PARTICLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute bg-[#C9A84C] rounded-full opacity-0"
            style={{
              left: p.left,
              width: p.width,
              height: p.width,
              animation: `float ${p.duration} linear infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* --- GLOBAL NAVIGATION --- */}
      <nav className={`fixed top-0 left-0 right-0 z-[200] flex justify-between items-center px-6 md:px-12 py-5 transition-all duration-400 ${
        scrolled ? 'bg-[#060606]/95 border-b border-white/5 backdrop-blur-md py-4' : 'bg-transparent'
      }`}>
        <a 
          href="https://instagram.com/ignyt.co" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-left font-montserrat-extrabold text-base md:text-lg tracking-[0.3em] font-extrabold uppercase text-[#F0EBE3] hover:opacity-85 transition-opacity"
        >
          IGNYT<span className="text-[#C9A84C]">.</span>CO
        </a>

        <div className="flex items-center gap-8">
          <ul className="hidden md:flex gap-9 list-none">
            <li>
              <a href="#about" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                About
              </a>
            </li>
            <li>
              <a href="#events" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                Events
              </a>
            </li>
            <li>
              <a href="#contact" onClick={() => setCurrentTab('home')} className="font-sans text-[10px] tracking-[0.35em] text-[#F0EBE3]/40 uppercase transition-colors hover:text-white">
                Contact
              </a>
            </li>
            <li>
              <button
                onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="font-sans text-[10px] tracking-[0.3em] text-[#C9A84C] border border-[#C9A84C]/40 px-5 py-2.5 uppercase transition-all duration-300 hover:bg-[#C9A84C] hover:text-[#060606]"
              >
                Register Now
              </button>
            </li>
          </ul>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden flex-col gap-1.5 cursor-pointer p-1 z-[201]"
          >
            <span className={`block w-[22px] h-[1px] bg-white transition-all transform origin-center ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block w-[22px] h-[1px] bg-white transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-[22px] h-[1px] bg-white transition-all transform origin-center ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* --- MOBILE DRAW-OUT MENU --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#060606]/98 z-[199] flex flex-col items-center justify-center gap-10 backdrop-blur-lg animate-modal-in">
          <a href="#about" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            About
          </a>
          <a href="#events" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            Events
          </a>
          <a href="#contact" onClick={() => { setMobileMenuOpen(false); setCurrentTab('home'); }} className="font-serif-cormorant font-light text-3xl text-[#F0EBE3]/40 tracking-wider hover:text-[#C9A84C] transition-colors">
            Contact
          </a>
          <button
            onClick={() => { setMobileMenuOpen(false); setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="font-sans text-xs tracking-[0.4em] text-[#C9A84C] border border-[#C9A84C]/40 px-8 py-3.5 uppercase hover:bg-[#C9A84C] hover:text-[#060606] transition-all"
          >
            Register Now
          </button>
        </div>
      )}


      {/* =========================================
                     HOMEPAGE TAB
         ========================================= */}
      {currentTab === 'home' && (
        <>
          {/* HERO BANNER SECTION */}
          <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 pt-[120px] pb-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-[#C9A84C]/5 to-transparent pointer-events-none" />
            
            <div className="font-sans text-[10px] tracking-[0.5em] text-[#C9A84C] uppercase mb-[28px] animate-rise">
              Chandigarh · Punjab · India
            </div>
            
            <h1 className="font-serif-cormorant font-light text-7xl md:text-8xl lg:text-[144px] leading-tight text-[#F0EBE3] tracking-tight mb-6 animate-rise">
              IGNYT<em className="not-italic text-[#C9A84C]">.</em>CO
            </h1>
            
            <div className="font-serif-cormorant italic font-light text-lg md:text-2xl lg:text-3xl text-[#F0EBE3]/40 tracking-[0.1em] mb-14 animate-rise">
              We Spark The Night.
            </div>
            
            <div className="w-[1px] h-16 bg-gradient-to-b from-[#C9A84C] to-transparent mb-14 animate-rise" />
            
            <div className="flex flex-wrap gap-4 justify-center animate-rise">
              <a 
                href="#events" 
                className="font-sans text-[10px] font-normal tracking-[0.4em] uppercase text-[#060606] bg-[#C9A84C] border border-[#C9A84C] px-10 py-4.5 hover:bg-transparent hover:text-[#C9A84C] transition-all duration-300"
              >
                Upcoming Events
              </a>
              <a 
                href="#about" 
                className="font-sans text-[10px] font-light tracking-[0.4em] uppercase text-[#F0EBE3]/40 bg-transparent border border-white/5 px-10 py-4.5 hover:border-[#F0EBE3]/30 hover:text-white transition-all duration-300"
              >
                Who We Are
              </a>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-rise">
              <span className="font-sans text-[8px] tracking-[0.4em] text-[#F0EBE3]/15 uppercase">Scroll</span>
              <div className="w-[1px] h-10 bg-gradient-to-b from-[#C9A84C] to-transparent animate-scroll-pulse" />
            </div>
          </div>

          {/* ABOUT SECTION */}
          <section id="about" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto">
            <div className="flex items-center gap-5 mb-14">
              <div className="font-sans text-[9px] font-light tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">About Us</div>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-serif-cormorant font-light text-4xl md:text-5xl lg:text-[56px] leading-[1.1] text-white mb-7">
                  We don't just plan events.<br /><em className="not-italic italic text-[#C9A84C]">We create nights</em> you remember.
                </h2>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-5">
                  IGNYT Co. is a Chandigarh-based event community built for the ones who want more than a predictable night. We craft immersive social experiences — from high-energy house gatherings and stylish pool sessions to exclusive prom nights and premium format events.
                </p>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-7">
                  Every gather is designed with absolute attention to detail. The music direction, the lighting structure, the handpicked crowd, and the physical vibes — everything is optimized so you walk in as an adventurer and walk out as a regular.
                </p>

                <div className="grid grid-cols-3 gap-[1px] bg-white/5 border border-white/5 mt-8">
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">01</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">Event Live</div>
                  </div>
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">25+</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">Attendees Expected</div>
                  </div>
                  <div className="bg-[#060606] py-7 px-5 text-center">
                    <div className="font-serif-cormorant text-4xl font-light text-[#C9A84C] leading-none mb-1.5">∞</div>
                    <div className="font-sans font-light text-[8px] tracking-[0.3em] text-[#F0EBE3]/15 uppercase">More Coming</div>
                  </div>
                </div>
              </div>

              <a 
                href="https://instagram.com/ignyt.co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="border border-white/5 aspect-[3/4] flex flex-col items-center justify-center bg-[#070707] relative overflow-hidden group hover:border-[#C9A84C]/25 transition-all duration-300 rounded shadow-2xl"
              >
                <div 
                  className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=95&w=1920&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-80"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 bg-[#0F0F0F]/65 group-hover:bg-[#0F0F0F]/40 transition-colors duration-500" />
                <div className="absolute inset-0 bg-radial-gradient from-[#C9A84C]/20 via-transparent to-transparent opacity-90" />
                
                <div className="font-sans font-light text-3xl tracking-[0.3em] text-white z-10 group-hover:text-[#C9A84C] transition-colors relative">
                  IGNYT<span className="text-[#C9A84C]">.</span>CO
                </div>
                <div className="font-serif-cormorant italic text-base text-[#F0EBE3]/70 mt-3 z-10 tracking-widest group-hover:text-white transition-colors relative">
                  We Spark The Night.
                </div>
                
                <div className="font-serif-cormorant italic text-[60px] text-[#C9A84C]/5 font-light absolute bottom-4 right-6 leading-none tracking-widest whitespace-nowrap select-none transition-all duration-500 group-hover:opacity-15">
                  IGNYT
                </div>
              </a>
            </div>
          </section>

          {/* EVENTS DISPLAY SECTION */}
          <section id="events" className="bg-[#0F0F0F] border-y border-white/5 py-24 px-6 md:px-12">
            <div className="max-w-[1100px] mx-auto">
              <div className="flex items-center gap-5 mb-14">
                <div className="font-sans text-xs font-semibold tracking-[0.4em] text-[#C9A84C] uppercase whitespace-nowrap">Upcoming Events</div>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              {/* ACTIVE EVENT CARD */}
              <div 
                onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="group relative flex flex-col md:flex-row justify-between items-start md:items-center gap-10 p-8 md:p-12 mb-12 bg-gradient-to-br from-[#1a1306] to-[#0A0A0A]/95 border border-[#C9A84C]/45 border-l-[6px] border-l-[#C9A84C] rounded-lg cursor-pointer hover:shadow-2xl hover:shadow-[#C9A84C]/5 hover:border-[#C9A84C] transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-[750px] relative z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full mb-5 select-none animate-pulse">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
                    <span className="font-sans font-semibold text-[11px] tracking-[0.2em] text-[#C9A84C] uppercase">
                      🔥 Active Event · Registrations Open
                    </span>
                  </div>
                  
                  <h3 className="font-serif-cormorant font-light text-4xl md:text-5xl lg:text-6xl text-white tracking-wide group-hover:text-[#C9A84C] transition-colors duration-300 mb-4 leading-tight">
                    Summer Pool Party
                  </h3>
                  
                  <p className="font-sans font-light text-sm text-[#F0EBE3]/90 leading-relaxed mb-6">
                    Dive into IGNYT Co.'s premier social pool gathering of the year. This event is designed as an exclusive <strong className="text-[#C9A84C] font-semibold">strangers meetup</strong> to connect you with like-minded, vibrant individuals in a wonderfully curated space. Enjoy <strong className="text-[#C9A84C] font-semibold">complimentary food & drink</strong> alongside custom deep-house sets, energetic pool activities, and premium hospitality. Securing spots is simple and quick.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-4 text-[#F0EBE3]/80 font-sans text-xs md:text-sm tracking-wide leading-relaxed">
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded">
                      <MapPin size={13} className="text-[#C9A84C]" /> Venue: <span className="text-white font-medium">Villa Ruhaniyat Farms, near cgc</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded">
                      <Calendar size={13} className="text-[#C9A84C]" /> Date: <span className="text-white font-medium">13 June</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded">
                      <Clock size={13} className="text-[#C9A84C]" /> Time: <span className="text-white font-medium">8:00 PM Onwards</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1.5 rounded">
                      <User size={13} className="text-[#C9A84C]" /> Age limit: <span className="text-white font-medium">18+ Only</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#C9A84C]/15 border border-[#C9A84C]/35 px-3 py-1.5 rounded text-[#C9A84C] font-medium">
                      🥂 Complimentary Food & Drink
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#C9A84C]/15 border border-[#C9A84C]/35 px-3 py-1.5 rounded text-[#C9A84C] font-medium">
                      🤝 Strangers Meetup
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end shrink-0 relative z-10">
                  <div className="w-full md:w-auto text-center font-sans text-xs tracking-[0.25em] font-semibold uppercase px-6 py-4.5 bg-[#C9A84C] text-black border border-[#C9A84C] group-hover:bg-transparent group-hover:text-[#C9A84C] transition-all flex items-center justify-center gap-2 rounded">
                    <Ticket size={14} />
                    Register Now
                  </div>
                </div>
              </div>

              {/* UNRELEASED COMMING SOON CARD */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-10 border-b border-white/5 opacity-50 cursor-default select-none hover:opacity-75 transition-all">
                <div>
                  <div className="font-sans font-semibold text-xs tracking-[0.3em] text-[#C9A84C] uppercase mb-3">
                    Coming Soon
                  </div>
                  <h3 className="font-serif-cormorant font-light text-3xl md:text-4xl text-white tracking-wide mb-3">
                    Prom Night
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-[#F0EBE3]/60 font-sans text-xs tracking-wider">
                    <span className="flex items-center gap-2">📍 Chandigarh & Around</span>
                    <span className="flex items-center gap-2">📅 Date TBA</span>
                  </div>
                </div>
                <div>
                  <div className="font-sans text-xs tracking-[0.25em] font-medium uppercase px-[22px] py-3.5 border border-white/10 text-white/50 rounded">
                    Stay Tuned
                  </div>
                </div>
              </div>

              {/* WINTER BALL CARD */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 py-10 border-b border-white/5 opacity-50 cursor-default select-none hover:opacity-75 transition-all">
                <div>
                  <div className="font-sans font-semibold text-xs tracking-[0.3em] text-[#C9A84C] uppercase mb-3">
                    Coming Soon · Winter Event
                  </div>
                  <h3 className="font-serif-cormorant font-light text-3xl md:text-4xl text-white tracking-wide mb-3">
                    Winter Ball
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-[#F0EBE3]/60 font-sans text-xs tracking-wider">
                    <span className="flex items-center gap-2">📍 Premium Hotel Grand Ballroom</span>
                    <span className="flex items-center gap-2">📅 November 2026</span>
                    <span className="flex items-center gap-2">👔 Dress Code: Black Tie Elegant</span>
                  </div>
                </div>
                <div>
                  <div className="font-sans text-xs tracking-[0.25em] font-medium uppercase px-[22px] py-3.5 border border-white/10 text-white/50 rounded">
                    Stay Tuned
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="py-24 px-6 md:px-12 max-w-[1100px] mx-auto">
            <div className="flex items-center gap-5 mb-14">
              <div className="font-sans text-[9px] font-light tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Get In Touch</div>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
              <div>
                <h2 className="font-serif-cormorant font-light text-4xl md:text-5xl lg:text-[52px] leading-[1.1] text-white mb-6">
                  Let's make<br /><em className="not-italic italic text-[#C9A84C]">something happen.</em>
                </h2>
                <p className="font-sans font-light text-sm text-[#F0EBE3]/40 leading-relaxed tracking-wide mb-9">
                  Have an enquiry about host collaborations, brand partnerships, bulk cohort registrations, or just want to be notified about priority slots? Raise a ticket or reach out directly.
                </p>

                <div className="flex flex-col gap-5">
                  <a href="https://instagram.com/ignyt.co" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Instagram</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-[#C9A84C] transition-colors">ignyt.co</div>
                  </a>
                  <a href="tel:7496088484" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Contact Phone</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">7496088484</div>
                  </a>
                  <a href="mailto:ignyt@ignyt.co.in" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Email</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">ignyt@ignyt.co.in</div>
                  </a>
                  <a href="https://ignyt.co.in" className="group flex items-center gap-4 text-decoration-none animate-rise">
                    <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase min-w-[90px]">Website</div>
                    <div className="font-serif-cormorant text-lg text-[#F0EBE3]/40 group-hover:text-white transition-colors">ignyt.co.in</div>
                  </a>
                </div>
              </div>

              <div>
                {querySuccess ? (
                  <div className="bg-[#0F0F0F] border border-[#C9A84C]/30 p-8 text-center animate-pop-in">
                    <CheckCircle className="text-[#C9A84C] mx-auto mb-4" size={36} />
                    <h3 className="font-serif-cormorant font-light text-2xl text-white mb-2">Message Transmitted</h3>
                    <p className="font-sans font-light text-xs text-[#F0EBE3]/40 leading-relaxed max-w-sm mx-auto">
                      Thank you for contacting us. Parth Dua or one of our organizers will reach back to you at your verified email shortly.
                    </p>
                    <button 
                      onClick={() => setQuerySuccess(false)}
                      className="font-sans text-[8px] tracking-widest text-[#C9A84C] uppercase underline mt-5 hover:opacity-85"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Name" 
                      required 
                      value={queryName}
                      onChange={e => setQueryName(e.target.value)}
                    />
                    <input 
                      type="email" 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Email" 
                      required 
                      value={queryEmail}
                      onChange={e => setQueryEmail(e.target.value)}
                    />
                    <textarea 
                      className="bg-[#0f0f0f] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-[14px] md:p-4 outline-none w-full min-h-[120px] resize-y focus:border-[#C9A84C]/35 transition-colors placeholder:text-[#F0EBE3]/15 placeholder:italic"
                      placeholder="Your Message..." 
                      required
                      value={queryMessage}
                      onChange={e => setQueryMessage(e.target.value)}
                    />

                    <button 
                      type="submit" 
                      disabled={querySubmitting}
                      className="bg-[#C9A84C] border border-[#C9A84C] text-[#060606] font-sans font-normal text-[10px] p-[16px] tracking-[0.4em] uppercase hover:bg-transparent hover:text-[#C9A84C] transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {querySubmitting ? 'Sending Message...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </>
      )}


      {/* =========================================
                   REGISTRATION FORM TAB
         ========================================= */}
      {currentTab === 'form' && (
        <div className="px-6 md:px-12 max-w-[820px] mx-auto pt-[125px] pb-12">
          
          <div className="text-center relative pb-10 border-b border-white/5 mb-11">
            <button 
              onClick={navigateToHome}
              className="absolute top-0 left-0 text-xs tracking-widest text-[#F0EBE3]/40 hover:text-[#C9A84C] uppercase flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div className="font-montserrat-extrabold text-xl tracking-[0.25em] font-extrabold uppercase mb-2">
              IGNYT<span className="text-[#C9A84C]">.</span>CO
            </div>
            <div className="font-sans text-[8px] tracking-[0.5em] text-[#C9A84C] uppercase mb-4 font-light">Presents</div>
            <h1 className="font-serif-cormorant font-light text-5xl md:text-7xl text-white tracking-wide">
              Summer Pool Party
            </h1>

            {/* EVENT SPECS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 border border-white/5 mt-11 text-left bg-[#0A0A0A]">
              <div className="p-6 border-r border-b border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Venue</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">Villa Ruhaniyat Farms</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">by Urban Oasis near cgc, Mohali</div>
              </div>
              <div className="p-6 border-b md:border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Date</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">13 June</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Saturday Showcase</div>
              </div>
              <div className="p-6 border-r md:border-r-0 border-b border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Time</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">8:00 PM Onwards</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Gates close strictly at 9:30 PM</div>
              </div>
              <div className="p-6 border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Dress Code</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">All Black</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">+ Neon accessories</div>
              </div>
              <div className="p-6 border-r md:border-r border-white/5">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Age Limit</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">18+ Only</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Valid physical ID mandatory</div>
              </div>
              <div className="p-6">
                <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2.5">Drink</div>
                <div className="font-serif-cormorant text-lg text-white leading-tight">BYOB</div>
                <div className="font-sans text-[9px] text-[#F0EBE3]/30 mt-1">Welcome drink included</div>
              </div>
            </div>
          </div>

          {/* WHAT'S INCLUDED ROW */}
          <div className="flex items-center gap-5 mt-14 mb-8">
            <span className="font-sans text-xs font-semibold tracking-[0.4em] text-[#C9A84C] uppercase whitespace-nowrap">What's Included</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-14">
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🍹</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Complimentary Drink</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                <strong className="text-[#C9A84C] font-semibold">1–2 premium welcome drinks are included</strong> with every pass type. BYOB is encouraged — feel free to bring your choice for the remainder of any preferences.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🍽️</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Complimentary Food</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                No outside catering is needed. <strong className="text-[#C9A84C] font-semibold">Splendid, piping hot complimentary food is fully sorted</strong> inside the compound. Come hungry, leave completely satisfied.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🎵</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">All Night Sounds</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                Crystals and deep bass. Non-stop, custom-curated underground tracks playing live from <strong className="text-[#C9A84C] font-semibold">8:00 PM onwards</strong>.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🏊</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Pool Activities & Games</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                Noodle jousting, deep-water volleyball, synchro jumps, and bespoke ambient glow accessories for a picture-perfect aquatic session.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🤝</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">High-Context Connections</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                No typical noisy club cliqueyness. We design interactions with structured breaks, games, and dynamic icebreakers to get you conversing instantly.
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-white/5 p-6 relative pl-10 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#C9A84C]">
              <span className="absolute left-4 top-5 text-lg">🎲</span>
              <h4 className="font-serif-cormorant text-xl text-white font-semibold mb-1">Group Party Games</h4>
              <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                Drunk Jenga towers, high-stakes Truth or Dare cards, custom Never Have I Ever rounds, and quick-fire flip cup relay tracks.
              </p>
            </div>
          </div>

          {/* TICKET PRICING LISTING */}
          <div className="flex items-center gap-5 mb-8">
            <span className="font-sans text-xs font-semibold tracking-[0.4em] text-[#C9A84C] uppercase whitespace-nowrap">Ticket Pricing</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-14">
            <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 p-7 text-center relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0F0F0F] rounded">
              <span className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] font-semibold uppercase mb-3 block">🎟️ Pass</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Female Entry Pass</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/50 mr-1">₹</span>999
              </div>
              <span className="font-sans text-xs text-[#F0EBE3]/60 mt-3 block tracking-wide">Limited Passes Available</span>
            </div>
            
            <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 p-7 text-center relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0F0F0F] rounded">
              <span className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] font-semibold uppercase mb-3 block">🎟️ Pass</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Male Entry Pass</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/50 mr-1">₹</span>1,499
              </div>
              <span className="font-sans text-xs text-[#F0EBE3]/60 mt-3 block tracking-wide">Limited Passes Available</span>
            </div>

            <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 p-7 text-center hover:border-[#C9A84C]/35 transition-colors relative overflow-hidden bg-gradient-to-br from-[#141414] to-[#0F0F0F] rounded">
              <span className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] font-semibold uppercase mb-3 block">🎟️ Pass</span>
              <h4 className="font-serif-cormorant text-2xl text-white font-light mb-2">Couple Entry (2 Persons)</h4>
              <div className="font-serif-cormorant text-[42px] text-white font-semibold flex items-center justify-center">
                <span className="text-xl font-light text-[#F0EBE3]/50 mr-1">₹</span>1,999
              </div>
              <span className="font-sans text-[8px] text-[#F0EBE3]/20 mt-3 block tracking-widest">Entry valid for standard mixed pairs only</span>
            </div>
          </div>

          {/* ATTENDEE FORM REGISTRATION */}
          <div className="flex items-center gap-5 mb-8">
            <span className="font-sans text-[9px] tracking-[0.5em] text-[#C9A84C] uppercase whitespace-nowrap">Attendee Registration</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">First Name *</label>
                <input 
                  type="text" 
                  className={`bg-[#0F0F0F] border ${formErrors.firstName ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={e => {
                    setFormData({...formData, firstName: e.target.value});
                    if(formErrors.firstName) setFormErrors({...formErrors, firstName: ''});
                  }}
                />
                {formErrors.firstName && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.firstName}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Last Name *</label>
                <input 
                  type="text" 
                  className={`bg-[#0F0F0F] border ${formErrors.lastName ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={e => {
                    setFormData({...formData, lastName: e.target.value});
                    if(formErrors.lastName) setFormErrors({...formErrors, lastName: ''});
                  }}
                />
                {formErrors.lastName && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.lastName}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Age * (Must be 18+)</label>
                <input 
                  type="number" 
                  className={`bg-[#0F0F0F] border ${formErrors.age ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="Valid Age (Mandatory)"
                  min="18"
                  max="60"
                  value={formData.age}
                  onChange={e => {
                    setFormData({...formData, age: e.target.value});
                    if(formErrors.age) setFormErrors({...formErrors, age: ''});
                  }}
                />
                {formErrors.age && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.age}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Gender *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.gender ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.gender}
                    onChange={e => {
                      setFormData({...formData, gender: e.target.value});
                      if(formErrors.gender) setFormErrors({...formErrors, gender: ''});
                    }}
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer Not To Say">Prefer not to say</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.gender && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.gender}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Phone Number *</label>
                <input 
                  type="tel" 
                  className={`bg-[#0F0F0F] border ${formErrors.phone ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={e => {
                    setFormData({...formData, phone: e.target.value});
                    if(formErrors.phone) setFormErrors({...formErrors, phone: ''});
                  }}
                />
                {formErrors.phone && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.phone}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Email Address *</label>
                <input 
                  type="email" 
                  className={`bg-[#0F0F0F] border ${formErrors.email ? 'border-red-500' : 'border-white/5'} text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic`}
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={e => {
                    setFormData({...formData, email: e.target.value});
                    if(formErrors.email) setFormErrors({...formErrors, email: ''});
                  }}
                />
                {formErrors.email && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">City of Origin *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.city ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.city}
                    onChange={e => {
                      setFormData({...formData, city: e.target.value});
                      if(formErrors.city) setFormErrors({...formErrors, city: ''});
                    }}
                  >
                    <option value="" disabled>Where are you traveling from?</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Mohali">Mohali</option>
                    <option value="Panchkula">Panchkula</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Amritsar">Amritsar</option>
                    <option value="Delhi / NCR">Delhi / NCR</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.city && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.city}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Instagram Handle</label>
                <input 
                  type="text" 
                  className="bg-[#0F0F0F] border border-white/5 text-white font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 placeholder:text-[#F0EBE3]/15 placeholder:italic"
                  placeholder="@yourhandle"
                  value={formData.instagram}
                  onChange={e => setFormData({...formData, instagram: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">How Did You Hear About Us? *</label>
                <div className="relative">
                  <select 
                    className={`bg-[#0F0F0F] border ${formErrors.heardFrom ? 'border-red-500' : 'border-white/5'} text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none`}
                    value={formData.heardFrom}
                    onChange={e => {
                      setFormData({...formData, heardFrom: e.target.value});
                      if(formErrors.heardFrom) setFormErrors({...formErrors, heardFrom: ''});
                    }}
                  >
                    <option value="" disabled>Select Referral Channels</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Friend">Friend Referral</option>
                    <option value="WhatsApp">WhatsApp Community</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other Marketing</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
                {formErrors.heardFrom && <span className="font-sans text-[9px] text-red-400 tracking-wider mt-0.5">{formErrors.heardFrom}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs tracking-[0.25em] text-[#C9A84C] uppercase font-semibold">Dietary Guidelines</label>
                <div className="relative">
                  <select 
                    className="bg-[#0F0F0F] border border-white/5 text-[#F0EBE3] font-serif-cormorant text-base p-4 outline-none w-full focus:border-[#C9A84C]/45 appearance-none"
                    value={formData.dietary}
                    onChange={e => setFormData({...formData, dietary: e.target.value})}
                  >
                    <option value="No restrictions">No restrictions</option>
                    <option value="Vegetarian">Vegetarian Only</option>
                    <option value="Vegan">Vegan Only</option>
                    <option value="Halal">Halal Choice</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C9A84C]">▼</div>
                </div>
              </div>

            </div>

            {/* TICKET TYPE SELECTOR INPUT */}
            <div className="flex flex-col gap-3 mt-4" id="ticket">
              <label className="font-sans text-[8.5px] tracking-[0.4em] text-[#C9A84C] uppercase">Select Your Pass Type *</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't1' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t1" 
                    checked={formData.ticket === 't1'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't1'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#C9A84C] mb-1">🎟️ Female</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Female Pass</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹999</span>
                </label>

                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't2' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t2" 
                    checked={formData.ticket === 't2'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't2'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#C9A84C] mb-1">🎟️ Male</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Male Pass</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹1,499</span>
                </label>

                <label className={`border p-5 text-center cursor-pointer transition-all flex flex-col justify-between items-center ${
                  formData.ticket === 't3' 
                    ? 'border-[#C9A84C] bg-[#C9A84C]/10' 
                    : 'border-white/5 bg-[#0F0F0F] hover:border-[#C9A84C]/20'
                }`}>
                  <input 
                    type="radio" 
                    name="ticket" 
                    className="hidden" 
                    value="t3" 
                    checked={formData.ticket === 't3'}
                    onChange={() => {
                      setFormData({...formData, ticket: 't3'});
                      if(formErrors.ticket) setFormErrors({...formErrors, ticket: ''});
                    }}
                  />
                  <span className="font-sans text-[7.5px] tracking-[0.3em] uppercase text-[#F0EBE3]/30 mb-1">🎟️ Couple</span>
                  <span className="font-serif-cormorant text-lg text-white font-medium">Couple Pass</span>
                  <span className="font-serif-cormorant text-sm text-[#F0EBE3]/50 mt-1">₹1,999</span>
                </label>
              </div>

              {formErrors.ticket && <span className="font-sans text-xs font-semibold text-red-400 tracking-wider mt-1">{formErrors.ticket}</span>}
            </div>

            {/* TERMS ACCORDION LIST */}
            <div className="flex items-center gap-5 mt-10 mb-6">
              <span className="font-sans text-xs font-semibold tracking-[0.4em] text-[#C9A84C] uppercase whitespace-nowrap">Terms & Conditions</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <ul className="list-none border border-white/5 bg-[#0F0F0F] rounded-sm divide-y divide-white/5">
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">01</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  This event is strictly <strong className="text-white font-semibold">18 years of age or older</strong>. Valid government-issued photo ID is mandatory at physical entry. No exceptions.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">02</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  <strong className="text-white font-semibold">Zero tolerance for narcotics or illegal contraband.</strong> Anyone caught violating state laws will be instantly escorted off-property and handed over to relevant law agencies.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">03</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  IGNYT Co. preserves absolute administrative authority to <strong className="text-white font-semibold">revoke entry or escort guests out</strong> of the site at any mark if found breaking code or behaving improperly, without reimbursement.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">04</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  By registering, you granting IGNYT Co. full legal <strong className="text-white font-semibold">permission to photograph and capture video footage</strong> of the pool party for use on social media formats (Instagram, YouTube, etc.) without royalty claims.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">05</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  Passes are completely <strong className="text-white font-semibold">non-transferable and non-refundable</strong> once generated. In rare force-majeure cases of organizer cancellation, a prompt refund will be sorted.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">06</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  BYOB is permitted within healthy moral constraints. Organizers maintain zero liability for individual safety or actions on heavily intoxicated guests.
                </p>
              </li>
              <li className="flex gap-4 p-5 items-start">
                <span className="font-serif-cormorant text-sm text-[#C9A84C] font-semibold">07</span>
                <p className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed tracking-wide">
                  Dress guidelines strictly demand <strong className="text-white font-semibold">All Black garments optionally accented with glowing/Neon options</strong>. Entry is forbidden for non-compliance.
                </p>
              </li>
            </ul>

            {/* CONSENT AND RULES ASSURANCE */}
            <div className="flex items-center gap-5 mt-10 mb-6">
              <span className="font-sans text-xs font-semibold tracking-[0.4em] text-[#C9A84C] uppercase whitespace-nowrap">Assurances & Consent</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <div className="flex flex-col gap-4" id="consent">
              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-white/10 bg-[#0F0F0F] mt-1 accent-[#C9A84C] shrink-0"
                  checked={consents.c1}
                  onChange={e => {
                    setConsents({...consents, c1: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                  I confirm that I am <strong className="text-white font-semibold">18 years of age or older</strong> and will have an official physical government photo ID with me for registration checks at the gate.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-white/10 bg-[#0F0F0F] mt-1 accent-[#C9A84C] shrink-0"
                  checked={consents.c2}
                  onChange={e => {
                    setConsents({...consents, c2: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                  I agree that <strong className="text-white font-semibold">IGNYT Co. may photograph and capture high-definition video</strong> of the gather to use globally for marketing, reels, recaps, and catalogs without legal bounds.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-white/10 bg-[#0F0F0F] mt-1 accent-[#C9A84C] shrink-0"
                  checked={consents.c3}
                  onChange={e => {
                    setConsents({...consents, c3: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                  I understand that <strong className="text-white font-semibold">illicit narcotics are absolutely prohibited</strong> in any shape. I accept that organizers holds the full legal privilege to immediately report me or banish me if caught using.
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-white/10 bg-[#0F0F0F] mt-1 accent-[#C9A84C] shrink-0"
                  checked={consents.c4}
                  onChange={e => {
                    setConsents({...consents, c4: e.target.checked});
                    if(formErrors.consent) setFormErrors({...formErrors, consent: ''});
                  }}
                />
                <span className="font-sans text-sm font-normal text-[#F0EBE3]/75 leading-relaxed">
                  I have read, understood, and voluntarily agree to comply with all <strong className="text-white font-semibold">Terms & Conditions</strong>. I acknowledge that passes are non-refundable.
                </span>
              </label>

              {formErrors.consent && <span className="font-sans text-xs font-semibold text-red-400 tracking-wider mt-1">{formErrors.consent}</span>}
            </div>

            <div className="text-center mt-12 mb-8">
              <button 
                type="button" 
                onClick={handleProceedToPayment}
                className="font-sans text-xs tracking-[0.4em] font-normal uppercase text-[#C9A84C] bg-transparent border border-[#C9A84C] px-16 py-5 cursor-pointer max-w-full hover:bg-[#C9A84C] hover:text-[#060606] transition-all duration-300"
              >
                Proceed to Payment
              </button>
              <div className="font-sans text-xs tracking-[0.2em] text-[#F0EBE3]/40 uppercase mt-5">
                Secure payment via Razorpay · UPI · Cards · Netbanking
              </div>
            </div>

          </form>

        </div>
      )}


      {/* =========================================
                   SUCCESS VIEW TAB
         ========================================= */}
      {currentTab === 'success' && (
        <div className="px-6 md:px-12 max-w-[620px] mx-auto text-center pt-[150px] pb-12 animate-rise">
          <span className="text-5xl mb-6 inline-block animate-pop-in">🎉</span>
          <h1 className="font-serif-cormorant font-light text-5xl md:text-7xl text-white tracking-wide mb-3 italic">
            You're In.
          </h1>
          <div className="font-sans text-[10px] tracking-[0.4em] text-[#C9A84C] uppercase mb-8">
            Booking Confirmed & Paid
          </div>
          
          <div className="w-12 h-[1px] bg-[#C9A84C] mx-auto mb-8 opacity-50" />

          <p className="font-sans font-light text-sm text-[#F0EBE3]/60 leading-relaxed tracking-wider mb-10">
            Your spot is officially <strong className="text-white font-medium">confirmed</strong> for the legendary <strong className="text-white font-medium">Summer Pool Party</strong> by IGNYT Co.<br /><br />
            Your payment was successful and we've dispatched your official ticket with your unique Booking ID to <strong className="text-[#C9A84C] font-normal">{registeredEmail}</strong>.<br /><br />
            <span className="block border border-white/5 bg-[#0F0F0F] p-4 rounded text-xs text-[#F0EBE3]/80 mb-4 text-left font-sans">
              <strong>Need assistance? Contact Organizer:</strong><br />
              📞 Phone: <a href="tel:7496088484" className="text-[#C9A84C] hover:underline">7496088484</a><br />
              ✉️ Email: <a href="mailto:ignyt@ignyt.co.in" className="text-[#C9A84C] hover:underline">ignyt@ignyt.co.in</a><br />
              📸 Instagram: <a href="https://instagram.com/ignyt.co" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">@ignyt.co</a>
            </span>
            Follow <strong className="text-[#C9A84C]">@ignyt.co</strong> on Instagram to catch direct updates on announcements!
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://instagram.com/ignyt.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-sans text-[9px] tracking-[0.35em] text-[#060606] bg-[#C9A84C] border border-[#C9A84C] px-10 py-5 uppercase hover:bg-transparent hover:text-[#C9A84C] transition-all"
            >
              Follow @ignyt.co
            </a>
            <button 
              onClick={navigateToHome}
              className="font-sans text-[9px] tracking-[0.35em] text-[#F0EBE3]/50 bg-transparent border border-white/5 px-10 py-5 uppercase hover:border-white/20 hover:text-white transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}


      {/* =========================================
                   ADMIN VIEWER TAB
         ========================================= */}
      {currentTab === 'admin' && (
        <div className="px-6 md:px-12 max-w-[1200px] mx-auto pt-[125px] pb-12">
          
          <div className="flex justify-between items-center pb-6 border-b border-white/5 mb-11">
            <div className="text-left">
              <h1 className="font-serif-cormorant font-light text-4xl text-white tracking-wider flex items-center gap-2">
                <Lock className="text-[#C9A84C]" size={24} /> Admin Dashboard
              </h1>
              <p className="font-sans text-[9px] tracking-widest text-[#C9A84C] uppercase mt-1">
                Attendee Verification Portal · parthdua007@gmail.com
              </p>
            </div>
            
            <button 
              onClick={navigateToHome}
              className="font-sans text-[10px] tracking-widest text-[#F0EBE3]/40 hover:text-[#C9A84C] uppercase flex items-center gap-1.5 border border-white/5 px-4 py-2 hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={12} /> Back
            </button>
          </div>

          {!isAdminAuthenticated ? (
            <div className="max-w-[440px] mx-auto bg-[#0F0F0F] border border-white/5 p-10 text-center rounded">
              <Sparkles className="text-[#C9A84C] mx-auto mb-4 animate-pulse" size={32} />
              <h3 className="font-serif-cormorant text-2xl text-white mb-2">Internal Clearance Needed</h3>
              <p className="font-sans font-light text-xs text-[#F0EBE3]/40 leading-relaxed mb-6">
                Please enter the security password or owner key to load current registrations and verify screenshots.
              </p>
              
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                <input 
                  type="password" 
                  placeholder="Clearance Key" 
                  required
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="bg-[#060606] border border-white/10 text-white font-sans text-center text-sm p-4 tracking-widest outline-none focus:border-[#C9A84C] transition-colors"
                />
                
                {adminError && <span className="text-xs text-red-400 tracking-wide block">{adminError}</span>}

                <button 
                  type="submit"
                  className="bg-[#C9A84C] text-[#060606] font-sans text-[10px] tracking-[0.3em] uppercase p-4 hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] transition-all"
                >
                  Verify Access
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-rise">
              
              {/* ADMIN CONTROLS ROW */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F] border border-white/5 p-6 mb-8 rounded">
                <div>
                  <h3 className="font-serif-cormorant text-2xl text-white font-light">Registrations Database</h3>
                  <p className="font-sans text-[10px] text-[#F0EBE3]/30 tracking-wider mt-1">
                    Razorpay-paid bookings appear as Verified automatically. Cross-check payments in your Razorpay Dashboard anytime.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={fetchRegistrations}
                    disabled={adminLoading}
                    className="font-sans text-[9px] tracking-widest text-[#C9A84C] border border-[#C9A84C]/35 bg-transparent px-5 py-3 uppercase hover:bg-[#C9A84C] hover:text-black transition-all disabled:opacity-40"
                  >
                    {adminLoading ? 'Syncing...' : 'Force Reload list'}
                  </button>
                  <a 
                    href="https://dashboard.razorpay.com/app/payments"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/50 border border-white/5 bg-transparent px-5 py-3 uppercase hover:border-[#C9A84C]/35 hover:text-white transition-all text-center"
                  >
                    Razorpay Dashboard
                  </a>
                </div>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-[#F0EBE3]/30 uppercase mb-1">Total Bookings</div>
                  <div className="font-serif-cormorant text-4xl text-white font-light">{adminRegistrations.length}</div>
                </div>
                <div className="bg-[#0F0F0F] border border-[#C9A84C]/20 p-5 rounded bg-[#C9A84C]/5">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-[#C9A84C] uppercase mb-1">Verified Slots</div>
                  <div className="font-serif-cormorant text-4xl text-[#C9A84C] font-semibold">
                    {adminRegistrations.filter(r => r.status === 'Verified').length}
                  </div>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-orange-400 uppercase mb-1">Pending Verification</div>
                  <div className="font-serif-cormorant text-4xl text-orange-400 font-semibold">
                    {adminRegistrations.filter(r => r.status === 'Pending Verification').length}
                  </div>
                </div>
                <div className="bg-[#0F0F0F] border border-white/5 p-5 rounded">
                  <div className="font-sans text-[8px] tracking-[0.3em] text-green-400 uppercase mb-1">Est. Collected Net</div>
                  <div className="font-serif-cormorant text-4xl text-green-400 font-semibold">
                    ₹{adminRegistrations
                      .filter(r => r.status === 'Verified')
                      .reduce((acc, curr) => {
                        const match = curr.ticket.match(/₹\s*(\d+)/);
                        if (match) {
                          return acc + parseInt(match[1]);
                        }
                        if (curr.ticket.includes('999')) return acc + 999;
                        if (curr.ticket.includes('1499')) return acc + 1499;
                        if (curr.ticket.includes('1999')) return acc + 1999;
                        return acc;
                      }, 0).toLocaleString('en-IN')
                    }
                  </div>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              {adminRegistrations.length === 0 ? (
                <div className="bg-[#0F0F0F] border border-white/5 p-16 text-center rounded">
                  <AlertCircle className="text-[#F0EBE3]/20 mx-auto mb-3" size={32} />
                  <p className="font-sans text-xs text-[#F0EBE3]/30 tracking-wider">No attendee records currently present on the system.</p>
                </div>
              ) : (
                <div className="bg-[#0F0F0F] border border-white/5 rounded overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0A0A0A]/80 font-sans text-[8px] tracking-[0.3em] text-[#C9A84C] uppercase">
                        <th className="p-4 py-4.5 font-normal">Attendee</th>
                        <th className="p-4 py-4.5 font-normal">Contact</th>
                        <th className="p-4 py-4.5 font-normal">Instagram</th>
                        <th className="p-4 py-4.5 font-normal">Origin</th>
                        <th className="p-4 py-4.5 font-normal">Pass Info</th>
                        <th className="p-4 py-4.5 font-normal">Status</th>
                        <th className="p-4 py-4.5 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4">
                            <div className="font-serif-cormorant text-lg text-white font-medium">{r.firstName} {r.lastName}</div>
                            <div className="font-sans text-[9px] text-[#F0EBE3]/35 tracking-widest uppercase mt-0.5">
                              ID: {r.id} · Age: {r.age} · {r.gender}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-sans text-xs text-white/80">{r.email}</div>
                            <div className="font-sans text-xs text-[#F0EBE3]/45 tracking-wide mt-1">{r.phone}</div>
                          </td>
                          <td className="p-4">
                            {r.instagram && r.instagram !== 'Not shared' ? (
                              <a 
                                href={`https://instagram.com/${r.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-sans text-xs text-[#C9A84C] hover:underline flex items-center gap-1"
                              >
                                <Instagram size={11} /> {r.instagram}
                              </a>
                            ) : (
                              <span className="font-sans text-xs text-[#F0EBE3]/20">None</span>
                            )}
                          </td>
                          <td className="p-4 font-sans text-xs text-white/70">
                            <div>{r.city}</div>
                            <div className="text-[9px] text-[#F0EBE3]/20 tracking-wide mt-0.5">Heard: {r.heardFrom}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-serif-cormorant text-base text-white">{r.ticket}</div>
                            {r.razorpayPaymentId ? (
                              <div className="font-sans text-[10px] text-green-400/90 mt-1 uppercase tracking-wider bg-green-400/5 border border-green-400/10 px-2 py-0.5 rounded inline-block font-medium">
                                💳 Razorpay: {r.razorpayPaymentId}
                              </div>
                            ) : r.transactionId && (
                              <div className="font-sans text-[10px] text-[#C9A84C]/90 mt-1 uppercase tracking-wider bg-[#C9A84C]/5 border border-[#C9A84C]/10 px-2 py-0.5 rounded inline-block font-medium">
                                {r.transactionId}
                              </div>
                            )}
                            <div className="font-sans text-[9px] text-[#F0EBE3]/25 tracking-wider mt-1.5 block">Diet: {r.dietary}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block font-sans text-[8px] tracking-widest uppercase px-2.5 py-1 rounded-sm border ${
                              r.status === 'Verified'
                                ? 'text-green-400 bg-green-400/5 border-green-400/20'
                                : 'text-orange-400 bg-orange-400/5 border-orange-400/20 animate-pulse'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {deleteConfirmId === r.id ? (
                                <div className="flex items-center gap-1.5 bg-[#1C1212] border border-red-900/40 p-1 px-2 rounded">
                                  <span className="text-[9px] text-[#FF6363] font-sans tracking-wide uppercase select-none mr-1 font-semibold">Delete?</span>
                                  <button
                                    onClick={() => handleDeleteRegistration(r.id)}
                                    className="font-sans text-[9px] tracking-widest uppercase text-red-100 bg-red-600 hover:bg-red-700 px-3 py-1 transition-all"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="font-sans text-[9px] tracking-widest uppercase text-white bg-white/10 hover:bg-white/20 px-3 py-1 transition-all"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {r.status !== 'Verified' && (
                                    <button 
                                      onClick={() => handleVerifyRegistration(r.id)}
                                      className="font-sans text-[8px] tracking-widest uppercase text-black bg-[#C9A84C] hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] px-3 py-1.5 transition-all"
                                    >
                                      ✓ Verify Payment
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setDeleteConfirmId(r.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-white/5 p-2 rounded transition-colors"
                                    title="Delete attendee"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>
      )}


      {/* =========================================
                   PAYMENT MODAL (RAZORPAY)
         ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#060606]/92 z-[500] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F0F0F] border border-[#C9A84C]/25 max-w-[480px] w-full p-8 md:p-10 text-center relative animate-modal-in rounded my-8">
            
            <button 
              onClick={() => { setIsModalOpen(false); setPaymentError(''); }}
              className="absolute top-4 right-5 text-[#F0EBE3]/30 hover:text-white text-2xl p-1 transition-colors outline-none"
            >
              ×
            </button>

            <div className="font-sans text-[8px] tracking-[0.4em] text-[#C9A84C] uppercase mb-2">Complete Your Booking</div>
            <h3 className="font-serif-cormorant text-2xl font-light text-white mb-1">
              {pricingData[formData.ticket as keyof typeof pricingData]?.name || 'Pass Admission'}
            </h3>
            
            <div className="font-serif-cormorant text-4xl md:text-5xl text-[#C9A84C] font-semibold leading-none mb-6">
              <span className="text-xl font-light mr-0.5">₹</span>
              {(pricingData[formData.ticket as keyof typeof pricingData]?.amount || 0).toLocaleString('en-IN')}
            </div>

            <div className="w-10 h-[1.5px] bg-[#C9A84C]/30 mx-auto mb-6" />

            <p className="font-sans text-[11px] text-[#F0EBE3]/60 leading-relaxed mb-2">
              You'll pay securely via <strong className="text-[#C9A84C]">Razorpay</strong>. Pay using any UPI app, debit/credit card, or netbanking.
            </p>
            <p className="font-sans text-[10px] text-[#F0EBE3]/40 leading-relaxed mb-6">
              ✅ Instant confirmation · Your ticket is emailed automatically the moment payment succeeds.
            </p>

            {paymentError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-5 text-left">
                <p className="font-sans text-[11px] text-red-400 leading-relaxed">{paymentError}</p>
                <a 
                  href="https://wa.me/917496088484?text=Hi%20IGNYT%2C%20I%20had%20trouble%20paying%20for%20the%20Summer%20Pool%20Party%20ticket.%20Please%20help."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 font-sans text-[10px] tracking-widest text-green-400 underline uppercase"
                >
                  💬 Message us on WhatsApp →
                </a>
              </div>
            )}

            <button 
              onClick={handleRazorpayPayment}
              disabled={submittingRegistration}
              className="w-full bg-[#C9A84C] text-black font-sans text-[10px] tracking-[0.3em] uppercase p-4 hover:bg-transparent hover:text-[#C9A84C] border border-[#C9A84C] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submittingRegistration ? 'Opening Payment...' : `Pay ₹${(pricingData[formData.ticket as keyof typeof pricingData]?.amount || 0).toLocaleString('en-IN')} Securely`}
            </button>

            <div className="font-sans text-[9px] text-[#F0EBE3]/30 tracking-wide mt-4">
              Trouble paying? Contact <a href="tel:7496088484" className="text-[#C9A84C] hover:underline">7496088484</a> or <a href="https://wa.me/917496088484" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] hover:underline">WhatsApp</a>
            </div>
          </div>
        </div>
      )}


      {/* --- FOOTER MAIN --- */}
      <footer className="px-6 md:px-12 max-w-[1100px] mx-auto pt-14 border-t border-white/5 flex flex-wrap justify-between items-center gap-6 mt-20 relative z-30">
        <div>
          <a 
            href="https://instagram.com/ignyt.co" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-sans text-xs tracking-widest text-[#F0EBE3] opacity-60 hover:text-[#C9A84C] transition-colors"
          >
            IGNYT<span className="text-[#C9A84C]">.</span>CO
          </a>
          <div className="font-serif-cormorant text-xs italic text-[#F0EBE3]/20 tracking-wider mt-1">
            We Spark The Night.
          </div>
        </div>

        <div className="flex gap-5">
          <button 
            onClick={navigateToHome}
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => { setCurrentTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors"
          >
            Register
          </button>
          <a 
            href="#admin"
            className="font-sans text-[9px] tracking-widest text-[#F0EBE3]/20 hover:text-[#C9A84C] uppercase transition-colors flex items-center gap-1.5"
          >
            <Lock size={10} /> Admin Panel
          </a>
        </div>

        <div className="font-sans text-[9px] font-extralight tracking-widest text-[#F0EBE3]/20 uppercase w-full text-center pt-6 border-t border-white/[0.02] mt-6">
          © 2026 IGNYT Co. · ignyt.co.in · Chandigarh, India · All rights reserved.
        </div>
      </footer>

    </div>
  );
}
